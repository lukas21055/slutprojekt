const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cookie = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require('fs');



const storage = multer.diskStorage({
    destination: "./resources/emilbilds/",
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + "-" + req.body.title + path.extname(file.originalname));
    },
  });
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static("resources"));
app.use(cookie())

mongoose.connect(process.env.MONGODBADRESS).then(() => console.log("Database Connected"))




const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  newPassword: String, // new field for the updated password
  image: String,
  listan: Array,
});

const images = new mongoose.Schema({
  image:String,
});
const uploadImage = new mongoose.Schema({
  image: String,
  des: String,
})

const NewImage = mongoose.model("newImages", uploadImage);
const User = mongoose.model("users", userSchema);
const Image = mongoose.model("images", images);

function auth(req, res, next){
  //console.log(req.cookies);
  if(req.cookies.id != null){
      console.log("Auth: inloggad");
      next()
  }
  else{
      res.status(401).redirect("/")
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10000000, // 1 MB
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("myImage");
const imageDir = path.join(__dirname, 'public', 'emilbilds');
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error image");
  }
}

app.post("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  
  const user = await User.findById(req.cookies.id);

  
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    return res.status(400).send("Invalid password");
  }

  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.cookies.id, {
    password: hashedPassword,
    newPassword: undefined,
  });

  res.redirect("/logout"); 
});


app.post("/upload", (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
      } else {
        if (req.file == undefined) {
          console.log("Error no file!");
        } else {
          console.log(req.file);
          NewImage.create({image:req.file.filename, des:req.body.title})
          res.send("File uploaded!");
        }
      }
    });
  });

app.post('/get_emil/:id/:dir', (req, res )=>{
    // console.log(req.params.id);
    User.findById(req.cookies.id, async (error, data)=>{
        // data.listan.push(req.params.id);
        
        await User.findByIdAndUpdate(req.cookies.id, {$push: {listan: req.params.dir}})

        await Image.create({image:req.params.id})


        console.log(req.params.id);
        await NewImage.findByIdAndDelete(req.params.id)
    })
    res.redirect("/inv")
})

app.post('/remove/:id', (req, res) => {
    res.redirect('/inv');
    User.findById(req.cookies.id, async(error, data) => {
      User.findByIdAndUpdate(
        req.cookies.id,
        { $pull: { listan: req.params.id } },
        (error, lol) => {
          console.log(lol);
        }
      );
      await Image.findOneAndDelete({ image: req.params.id })
    });
  });



app.get("/", (req, res) => {
    res.render("login")
})
app.get("/", (req, res) => {
    res.render("inv")
})

app.get("/inv", auth,(req, res) => {
    User.findById(req.cookies.id, (error, data)=>{
      console.log('data: '+data);
        res.render("inv", {listan:data.listan})
        
    })
})

app.post("/sell", (req, res) => {
    findByIdAndRemove(req.params.id)
})


app.get("/main", auth,async(req, res) => {
    //const images = []

    
    // fs.readdir("resources/emilbilds", (err, files) => {
    //     files.forEach(file => {
    //       images.push(file);
    //     });
    //   });

    
    NewImage.find({}, (error, data)=>{
      data.reverse();
      User.findById(req.cookies.id, (error, userData)=>{
        res.render("main", {username:userData.username, image:data})
      })
    })

    // const sold = await (await Image.find({})).map((item) => item.image);
    // const filtered = images.filter(item => !sold.includes(item));
    // console.log(sold);
    // User.findById(req.cookies.id, (error, data)=>{
    //     res.render("main", {username:data.username, image:filtered})
    // })
    
})
app.get("/login", (req,res)=>{
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})
app.get("/about", (req,res) => {
  res.render("about")
})

app.post("/register", (req,res) =>{
  const {username, password, color} = req.body;
  User.findOne({username}, (err, data) => {
    if (!data) {
      bcrypt.genSalt(10, (error, salt)=> {
        bcrypt.hash(password, salt, (error, crypted)=>{
          User.create({username, password:crypted})
          res.redirect("/login")
        })
      })
    }
    else {
      const errorMessage = "Username already exists";
      res.render("register", { error: errorMessage });
    } 
  })
})


app.post("/login", (req, res)=>{
    const {username, password} = req.body
    User.find({username}, (err, user)=>{
        if (err){
            console.log(err)
        } else {
            if (bcrypt.compareSync(req.body.password, user[0].password)){
                console.log("LOL", user[0].id)
                res.cookie("id", user[0].id).redirect("/main")
            } else {
                res.send("wrong data")
            }
        }
    })
})


app.post("/logout", (req, res)=>{
    res.clearCookie("id").clearCookie("user").redirect("/")
})



app.post("/delete", (req, res)=>{
    console.log("LOLIPO",req.cookies.id);
    User.findByIdAndRemove(req.cookies.id, (error, data)=>{
        console.log(data);
        res.clearCookie("login").clearCookie("user").redirect("/")
    })
})

app.get('/edit', auth, (req, res) =>{
  User.findById(req.cookies.id, (error, data)=>{
      if(data)
          return res.render('edit', {data: data.username})
      else{
          return res.render('login')
      }
  })
})
app.post('/edit', auth, (req, res) =>{
  console.log(req.body);
  User.findByIdAndUpdate(req.cookies.id, {username: req.body.username}, (error, data)=>{
      if(error) return error
      res.redirect('/inv')
  })
})



app.listen(3000, (error)=>{
    console.log(123);
    if(error){
        console.log(error);
    }else{
        console.log("connected");
    }
})



