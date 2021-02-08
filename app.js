//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);

const itemsSchema ={
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Whatever you do today, do your Best!"
});

const item2 = new Item({
  name: "Hit + to get started"
});

const defaultItem = [item1,item2];

const listSchema = {
  name: String,
  item: [itemsSchema]
};

const List = mongoose.model("Lists",listSchema);

app.get("/", function(req, res) {

const day = date.getDate();

Item.find({}, function(err,foundItems){
  if(foundItems.length === 0){
    Item.insertMany(defaultItem,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Entry added Successfully");
      }
    })
    res.redirect("/");
  }else{
    if(err){
      console.log(err);
    }else{
      List.find({},function(err,foundListNames){
        if(!err){
        res.render("list", {listTitle: "Today", newListItems: foundItems, listNames: foundListNames});
        }
      });
    }
  }
});

});

app.get("/:ListName",function(req,res){
  const customListName = _.capitalize(req.params.ListName);

  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //creating a new list

        const list = new List({
          name: customListName,
          item: defaultItem
        });

        list.save();
        res.redirect("/" + customListName)
      }else{
        List.find({},function(err,foundListNames){
          if(!err){
          res.render("list", {listTitle: foundList.name, newListItems: foundList.item, listNames: foundListNames});
          }
        });
      }
    }
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
     name: itemName
  });

  if( listName === "Today"){
    item.save();
    res.redirect('/'); 
  }else{
    List.findOne({name: listName}, function(err,foundList){
      foundList.item.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

  

});

app.post("/delete", function(req, res){
  const itemId = req.body.checkbox;
  const listName = req.body.list;

  if(listName === "Today"){
  Item.findByIdAndRemove(itemId,function(err){
    if(!err){
      console.log("Task Completed");
      res.redirect("/");
    }
  });
}else{
  List.findOneAndUpdate({name: listName},{$pull: {item: {_id: itemId}}}, function(err,foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  });
}

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
