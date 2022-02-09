require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const flash = require('connect-flash');
const app = express();
// using ejs
app.set('view engine', 'ejs');

// using body parser
app.use(bodyParser.urlencoded({ extended: true }));

//serving static files
app.use(express.static(__dirname+'/public'));

//setting up session

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false
}));

// initilizing passport and setting up passport to manage sessions
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//connecting to the database
mongoose.connect(process.env.DATABASE,{ useNewUrlParser: true });

//database schema
const listSchema = new mongoose.Schema({
  listItem:String
})

const otherListSchema = new mongoose.Schema({
  name:String,
  listItems:[listSchema]
});

const userSchema = new mongoose.Schema({
  username:String,
  listItems:[listSchema],
  otherListItems:[otherListSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



const List = mongoose.model("List",listSchema);
const otherList = mongoose.model("otherList",otherListSchema);


//todo welcome text
const welcome = new List({
  listItem:"Welcome to your TodoApp"
});

const adding = new List({
  listItem:"To add new todo check the top radio button"
});

const deleting = new List({
  listItem:"<--- check this to delete"
});

const morePages = new List({
  listItem:"enter anything in the url to get a new page after /todo-home ie(/todo-home/something)"
});

const firstData = [welcome,adding,deleting,morePages];


app.get("/",(req,res)=>{
  res.sendFile(__dirname+"/index.html");
});

//sign in/sign up/logout functionality
app.get("/sign-in",(req,res)=>{
  res.render("sign-in-up",{postRoute:"/sign-in",postMethod:"sign in",errMessage:"no"})
});

app.get("/sign-up",(req,res)=>{
  res.render("sign-in-up",{postRoute:"/sign-up",postMethod:"sign up",errMessage:"no"})
});

app.get('/log-out', function(req, res){
  req.logout();
  res.redirect('/sign-in');
});

app.get('/todo-home/log-out', function(req, res){
  req.logout();
  res.redirect('/sign-in');
});

//if users try to go to non existing routes from sign-in/sign-up redirect them back to where they tried to leave
app.get("/sign-up/:something",(req,res)=>{
  res.redirect("/sign-up")
});

app.get("/sign-in/:something",(req,res)=>{
  res.redirect("/sign-in")
});

//registering new users
app.post("/sign-up",(req,res)=>{
  const userName= req.body.username;
  const password= req.body.password;

  if(userName && password){
    //do this if new users provide a username and password

    //checking if the new users exist in database and saving the new user if they dom't exist
    User.findOne({username:userName},(err,foundUser)=>{
      if(err){
        console.log(err);
      }else{
        //if user is found in the database,ask the new user to choose a different username
        if(foundUser){
          req.flash("info",`the name ${userName} already exists for a user,try another name.`);
          res.render("sign-in-up",{postRoute:"/sign-up",postMethod:"sign up",errMessage:req.flash("info")[0]})
        }else{
          //if new users are not found in database,register them and take them to main todoPage
          User.register({username:userName},password, function(err, user){
            passport.authenticate("local")(req,res,()=>{
               res.redirect("/todo-home");
             });

          });

        }


      }

    });

  }else{
    //if they submit an empty form,force them to provide a username and password
    req.flash("info","you can't signup without choosing a username and a password for your account.");
    res.render("sign-in-up",{postRoute:"/sign-up",postMethod:"sign up",errMessage:req.flash("info")[0]})
  }


});

//signing in existing users
app.post("/sign-in",(req,res)=>{
  const userName= req.body.username;
  const password= req.body.password;

//the user to be logged in
  const user = new User({
    username:req.body.username,
    password:req.body.password
  })

  if(userName && password){
    //do this if the users provide a username and a password
    User.findOne({username:userName},(err,foundUser)=>{
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          //if the users exist in the database check if their passwords match and then log them in.
          foundUser.authenticate(password, function(err,model,passwordError){
            if(passwordError){
              req.flash("info","incorrect password! please check and try again.")
              res.render("sign-in-up",{postRoute:"/sign-in",postMethod:"sign in",errMessage:req.flash("info")[0]})

            } else{
              req.login(user, function(err) {
                if(err){
                  console.log(err);
                  res.redirect("/sign-in")
                }else{
                  passport.authenticate("local")(req,res,function(){
                    res.redirect("/todo-home")});
                }

            });

            }
        });

        }else{
          //if users are not registered force them to signup
          req.flash("info",`${userName} not found in the database,sign up instead.`);
          res.render("sign-in-up",{postRoute:"/sign-up",postMethod:"sign up",errMessage:req.flash("info")[0]})

        }
      }

    });

  }else{
    //if users try to login while the form is still empty don't even bother checking the database.force them to provide credentials
    req.flash("info","sorry!,you can't sign in without providing both username and password.");
    res.render("sign-in-up",{postRoute:"/sign-in",postMethod:"sign in",errMessage:req.flash("info")[0]})
  }



});




//todoApp functionality
//main todo page for users
app.get("/todo-home",(req,res)=>{
  // console.log(req.user);
  //only authenticated users can access the todoApp
  if(req.isAuthenticated()){
    User.findOne({username:req.user.username},(err,foundUser)=>{
      if(err){
        console.log(err);
        res.redirect("/todo-home");
      }else{

        if(foundUser.listItems.length === 0){

          firstData.forEach((data)=>{
            foundUser.listItems.push(data);
          })
          foundUser.save((err)=>{if(err){console.log(err);}else{console.log("successfully added intro/first data for user");}})
          res.redirect("/todo-home");

        }else{
          res.render("todo",{listType:"Main",allTodos:foundUser.listItems,currentUser:req.user});
        }

      }

    });


  }else{
    res.redirect("/sign-in")
  }


});

//loading more todo pages for users
app.get("/todo-home/:otherList",(req,res)=>{
//only authenticated user can use the TodoApp
if(req.isAuthenticated()){
  User.findOne({username:req.user.username},(err,foundUser)=>{
    if(err){
      console.log(err);
      res.redirect("/todo-home");
    }else{
      if (foundUser.otherListItems.filter(function(e) { return e.name === _.capitalize(req.params.otherList) ; }).length > 0) {

        //this populates the intro data to newly generated lists but it is not useful in thise
        // foundUser.otherListItems.forEach((otherList)=>{
        //   if(otherList.name === _.capitalize(req.params.otherList) && otherList.listItems.length === 0){
        //
        //     firstData.forEach((data)=>{
        //       otherList.listItems.push(data)
        //     });
        //     foundUser.save((err)=>{if(err){console.log(err);}else{console.log("successfully added the first/into listitems to otherlist for user ");}})
        //
        //
        //   }
        // })
        res.render("todo",{listType:_.capitalize(req.params.otherList),currentUser:req.user});





      }else{
        const newList = new otherList({
          name:_.capitalize(req.params.otherList),
          listItems:[]
        });
        foundUser.otherListItems.push(newList)
        foundUser.save((err)=>{if(err){console.log(err);}else{console.log("successfully added the first new listname to otherlist for user ");}})
        res.redirect("/todo-home/"+_.capitalize(req.params.otherList));
      }





    }

  });



}else{
  res.redirect("/sign-in")
}


});


// adding new todos to the database
app.post("/todo-home",(req,res)=>{
  if(req.body.listtype === "Main"){

    //this is added if the listtype is main or rather if the user is on his main todo page
    const newListItem = new List({
      listItem:req.body.newListItem
    });

    if(req.body.newListItem.length > 0){
      //saving new list for logged in user
      User.findOne({username:req.user.username},(err,foundUser)=>{
        if(err){
          console.log(err);
          res.redirect("/todo-home");
        }else{
          foundUser.listItems.push(newListItem);
          foundUser.save((err)=>{if(err){console.log(err);}else{console.log("successfully added new main todo for user");}})
          res.redirect("/todo-home");
        }

      });



    }else{
      res.redirect("/todo-home");
    }


  }else{
    if(req.body.newListItem.length > 0){
      //adding new todo for other todo Pages
      const newOtherListItem = new List({
        listItem:req.body.newListItem
      });

      console.log(`new post request coming for otherlist called:${req.body.listtype}`);

      User.findOne({username:req.user.username},(err,foundUser)=>{
        if(err){
          console.log(err);
          res.redirect("/todo-home/"+req.body.listtype);
        }else{
          foundUser.otherListItems.forEach((otherItem,index)=>{
            if(otherItem.name === req.body.listtype){
              otherItem.listItems.push(newOtherListItem);
              foundUser.save((err)=>{if(err){console.log(err);}else{console.log("successfully added new todo to user's otherlists");}})
              res.redirect("/todo-home/"+req.body.listtype);

            }
          })




        }

      });

    }else{
      res.redirect("/todo-home/"+req.body.listtype);
    }


  }




});

//deleting todos from the database
app.post("/delete",(req,res)=>{
  if(req.body.listtype === "Main"){
    //deleting todos posted by user from the main
    User.findOneAndUpdate({username:req.user.username},{$pull:{listItems:{_id:req.body.todoID} }},(err,foundUser)=>{
      if(err){
        console.log(err);
        res.redirect("/todo-home")
      }else{
        console.log("successfully deleted todo item from main todo");
        res.redirect("/todo-home")
      }
    });


  }else{
    console.log(req.body);
    const otherIndex = req.body.otherIndex
    User.findOneAndUpdate({username:req.user.username},{$pull:{"otherListItems.$[].listItems":{_id:req.body.todoID}}},(err,foundUser)=>{
      if(err){
        console.log(err);
        res.redirect("/todo-home")
      }else{
        console.log("successfully deleted todo item from otherlist todo");
        res.redirect("/todo-home/"+req.body.listtype);
      }
    });




  }


})



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,(req,res)=>{
  console.log(`server running on port ${port}`);
})
