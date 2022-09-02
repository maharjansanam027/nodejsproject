require('dotenv').config()

const express = require("express");
const path=require('path');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const app = express();
const port=80;

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/contactDance');
}

app.use(express.urlencoded());

const contactSchema = new mongoose.Schema({
    name: String,
    phone: Number,
    email: String,
    password: String,
    desc: String,
    tokens:[{
        token:{
            type:String
        }
    }]
});

// genetaing token 
contactSchema.methods.generateAuthToken = async function(){
    try {
        console.log(this._id.toString());
        const token = await jwt.sign({_id:this._id}, process.env.SECRET_KEY);
        console.log(token);
        this.tokens = this.tokens.concat({token:token})
        await this.save();
        return token;
        
    } catch (error) {
        // res.send(err/or)
        console.log(error);
        
    }
}

contactSchema.pre("save", async function(next){
        // if(this.isModified("password")){
            console.log(`password is ${this.password}`);
            this.password = await bcryptjs.hash(this.password,10);
            console.log(`password is ${this.password}`);
        // }
        // next();
})

const contact = mongoose.model('contact', contactSchema);


// Express stuff
app.use('/static',express.static('static'));

app.set('view engine', 'pug')
app.set('views',path.join(__dirname,'views'));


// console.log(process.env.SECRET_KEY);

app.get('/',(req, res)=>{
    const params={}
    res.status(200).render('home.pug',params);
})
app.get('/contact',(req, res)=>{
    const params={}
    res.status(200).render('contact.pug',params);
})
app.get('/login',(req, res)=>{
    const params={}
    res.status(200).render('login.pug',params);
})

// const contacts =contact.find({name:"sanam maharjan"},function(err,data){
//     if(err) return console.error(err);
//     console.log(data);

// });

// const createToken= async()=>{
//     const token = await jwt.sign({_id:"6309bf0cd3ce7d2b771cb86d"},"thisissanammaharjanliveinbangalore",{expiresIn:"2 minutes"});
//     console.log(token)

//     const verify= await jwt.verify(token,"thisissanammaharjanliveinbangalore")
//     console.log(verify);
// }
// createToken();


app.post('/contact',async(req, res)=>{
    let myData= new contact(req.body);
    console.log("sucess part"+myData);



    const token = await myData.generateAuthToken();
    console.log("the token part"+token);

    myData.save().then(()=>{
        res.send("contact is saved.");
        console.log(myData);
    }).catch(()=>{
        res.status(404).send("item was not saved");
    })
})

app.post('/login', async (req, res)=>{
    try {
        let email = req.body.email;
        let password = req.body.password;
        const useremail =  await contact.findOne({email:email});

        const isMatch =  await bcryptjs.compare(password, useremail.password)

        const token = await useremail.generateAuthToken();
        console.log("the token part "+token);

        if(isMatch){
            res.status(201).render('home.pug');
        } else{
            res.send("password not match");
        }
    } catch (error) {
        res.status(401).send("invalid email")
    }
})

//start the server.
app.listen(port,()=>{
    console.log(`server started sucessfully on port ${port}`);
})