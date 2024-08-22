const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render("index");         // iss line m consol.log(hey) terminal m hey show hoga.... res.send krne s page p dikhega
                                 // render use krte h kyunki view engine set kiya h... toh humlog view s koi b page ko show kr skte h
});


app.get('/login', (req, res) => {
    res.render("login");                         
});


app.get('/profile', isLoggedIn, async (req, res) => {          //ye ek protected route hai 
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile", {user});                         
});


app.get('/like/:id', isLoggedIn, async (req, res) => {           
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){    //-1 tab return krta h jab wo element present ni hota h
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);    //splice mtlb htao, uss index wale bande ko htao... aur 1 ka mtlb ek hi htao.
    }

    await post.save();
    res.redirect("/profile");                 
});


app.get('/edit/:id', isLoggedIn, async (req, res) => {           
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    res.render("edit",{post})
});


app.post('/update/:id', isLoggedIn, async (req, res) => {           
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content})
    res.redirect("/profile");
});


app.post('/post', isLoggedIn, async (req, res) => {     // is post ko tabhi work karega jab user logged in rhega nhi toh login page p redirect krdiya jayega
    let user = await userModel.findOne({email: req.user.email})
    let {content} = req.body;
    
    let post = await postModel.create({
        user: user._id,
        content
    });
    
    user.posts.push(post._id);    //ye data association ka part hai
    await user.save();
    res.redirect("/profile") 
});


app.post('/register', async (req, res) => {     // ye para jo humlog index.ejs m banaye h uske liye h(mtlb ye form m jo details fill krenge uske liye h)
    let {email, password, username, name, age} = req.body;

    let user = await userModel.findOne({email})     //findOne s check hoga ki login krne time email already exist krta h ki nhi(mtlb user already registered h ya nhi)
    if(user) return res.status(500).send("User already registeerd");

    bcrypt.genSalt(10, (err, salt) => {     
        bcrypt.hash(password, salt, async (err,hash) =>{     // agar user nhi h, mtlb new user h tab bcrypt ka use krte h user create krne k liye
            let user = await userModel.create({             //hash password h jo humlog ko save krna hai
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({email: email, userid: user._id}, "shhhhs");    //iske upar wale para s user aa gaya h ab isko login rkhne k liye token generate karenge....shhhhs ek secret key h
            res.cookie("token", token);
            res.send("registered");
        })                                               
    })                                         
});


app.post('/login', async (req, res) => {     // ye para jo humlog login.ejs m banaye h uske liye h(mtlb ye form m jo details fill krenge uske liye h)
    let {email, password} = req.body;

    let user = await userModel.findOne({email});     //findOne s check hoga ki login krne time email already exist krta h ki nhi(mtlb user already registered h ya nhi)
    if(!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, function (err, result){   //isme old pass aur new pass compare krna hota h
        if(result) {
            let token = jwt.sign({email: email, userid: user._id}, "shhhhs");       //iske upar wale para s user aa gaya h ab isko login rkhne k liye token generate karenge....shhhhs ek secret key h
            res.cookie("token", token);
            res.status(200).redirect("/profile");    
        }                                                                           //error milega true ya false(password sahi ya galat k basis p)
        else res.redirect("/login")                                                    //nhi toh  yehi s usse wapis bhej denge ki bhai galat h
    })       
});


app.get('/logout', (req, res) => {          //logout ka mtlb jo cookie set kiye the usko hatana
    res.cookie("token", "");
    res.redirect("/login");                         
});

function isLoggedIn(req, res, next){      //middleware create kr rhe protected routes k liye
    if(req.cookies.token === "") res.redirect("/login");    //res.send("You must be logged in");    // iss para k wajah s route protected h
    else{
        let data = jwt.verify(req.cookies.token, "shhhhs");
        req.user = data;
        next();
    }
}                                       

app.listen(3000);   