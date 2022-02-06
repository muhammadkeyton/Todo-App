const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
// using ejs
app.set('view engine', 'ejs');

// using body parser
app.use(bodyParser.urlencoded({ extended: true }));

//serving static files
app.use(express.static(__dirname+'/public'));

//connecting to database
mongoose.connect('mongodb://localhost:27017/TodoApp');

//database schema
const userSchema = new mongoose.Schema({
  username:String
})

const listSchema = new mongoose.Schema({
  listItem:String
})

const otherListSchema = new mongoose.Schema({
  name:String,
  listItems:[listSchema]
});

const User = mongoose.model("User",userSchema);
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

app.get("/sign-in",(req,res)=>{
  res.render("sign-in-up")
});


//main todo page for users
app.get("/todo-home",(req,res)=>{
  List.find({}, function (err,foundTodos){
    if(err){
      console.log(err);
    }else{
      if(foundTodos.length === 0){
        List.insertMany(firstData,(err,docs)=>{
          if(err){
            console.log(err);
          }else{
            console.log("successfully loaded sample data in database.");
            res.redirect("/todo-home");
          }
        });


      }else{
        res.render("todo",{name:"muhammad",listType:"Main",allTodos:foundTodos});
      }
    }
  });


});

//loading more todo pages for users
app.get("/todo-home/:otherList",(req,res)=>{

  otherList.findOne({name:_.capitalize(req.params.otherList)},(err,foundList)=>{
    if(err){
      console.log(err);
    }else{
      if(!foundList){
        const newList = new otherList({
          name:_.capitalize(req.params.otherList),
          listItems:firstData
        });
        newList.save();
        res.redirect("/todo-home/"+_.capitalize(req.params.otherList));

      }else{
        res.render("todo",{name:"muhammad",listType:_.capitalize(req.params.otherList),allTodos:foundList.listItems});
      }

    }

  });


})


// adding new todos to the database
app.post("/todo-home",(req,res)=>{
  if(req.body.listtype === "Main"){
    const newListItem = new List({
      listItem:req.body.newListItem
    });

    if(req.body.newListItem.length > 0){
      newListItem.save((err)=>{
        if(err){console.log(err);}else{console.log("successfully saved new list item to db");}
      });
      res.redirect("/todo-home");

    }else{
      res.redirect("/todo-home");
    }


  }else{
    if(req.body.newListItem.length > 0){
      otherList.findOne({name:req.body.listtype},(err,foundList)=>{
        if(err){
          console.log(err);
        }else{
          if(foundList){
            const listItem = new List({
              listItem:req.body.newListItem
            });
            foundList.listItems.push(listItem);
            foundList.save();
            res.redirect("/todo-home/"+req.body.listtype);
          }
        }
      })

    }else{
      res.redirect("/todo-home/"+req.body.listtype);
    }


  }




});

//deleting todos from the database
app.post("/delete",(req,res)=>{
  if(req.body.listtype === "Main"){
    List.findByIdAndDelete(req.body.todoID,(err)=>{
      if(err){console.log(err);}else{
        console.log("successfully deleted todo item");
      }
      res.redirect("/todo-home");
    });

  }else{

    otherList.findOneAndUpdate({name:req.body.listtype},{ $pull: {listItems:{_id:req.body.todoID} } },(err,docs)=>{
      if(err){
        console.log(err);
      }else{
        console.log("successfully deleted document in lists collection from database.");
        res.redirect("/todo-home/"+req.body.listtype);
      }
    });
    console.log(req.body);
  }


})







app.listen(3000,(req,res)=>{
  console.log("server running on port 3000");
})
