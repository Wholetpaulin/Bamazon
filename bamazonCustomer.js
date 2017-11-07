var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  // Your username
  user: "root",
  // Your password
  password: "",
  database: "bamazon"
});

// connect to the mysql server and sql database
connection.connect(function(err) {
  if (err) throw err;
  // run the start function after the connection is made to prompt the user
  start();
});

// function which prompts the user for what action they should take
function start() {
  inquirer
    .prompt({
      name: "postOritem",
      type: "list",
      message: "Would you like to [BUY] or [RESTOCK] an item?",
      choices: ["BUY", "RESTOCK"]
    })
    .then(function(answer) {
      // based on their answer, either call the item or the post functions
      if (answer.postOritem.toUpperCase() === "BUY") {
        buy();
      }
      else {
        restock();
      }
    });
}

function buy() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt the user for which they'd like to item on
    inquirer
      .prompt([
        {
          name: "choice",
          type: "rawlist",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].product_name);
            }
            return choiceArray;
          },
          message: "\n-----------------------------------\nWhich item would you like to buy?"
        },
        {
          name: "amount",
          type: "input",
          message: "How many would you like?"
        }
      ])
      .then(function(answer) {
        // get the information of the chosen item
        //make this specific to your problem

        var chosenItem;
        for (var i = 0; i < results.length; i++) {
          if (results[i].product_name === answer.choice) {
            chosenItem = results[i];
          }
        }

        // determine there was enough stock in the dtabase for the request
        if (chosenItem.stock_quantity > parseInt(answer.amount)) {
          var newAmount = chosenItem.stock_quantity - answer.amount;
          var total = answer.amount * chosenItem.price;
          console.log(newAmount + " " + chosenItem.product_name + "s left in stock.");
          // item was high enough, so update db, let the user know, and start over
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: newAmount
              },
              {
                item_id: chosenItem.item_id
              }
            ],
            function(error) {
              if (error) throw err;
              console.log(answer.amount + " " + chosenItem.product_name + "s purchased.  Total: $" + total + ".00");
              start();
            }
          );
        }
        else {
          // item wasn't high enough, so apologize and start over
          console.log("ERROR! The stock count may have been too low. Try again...");
          start();
        }
      });
  });
}

function restock() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt the user for which they'd like to item on
    inquirer
      .prompt([
        {
          name: "choice",
          type: "rawlist",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].product_name);
            }
            return choiceArray;
          },
          message: "\n-----------------------------------\nWhich item would you like to restock?"
        },
        {
          name: "amount",
          type: "input",
          message: "How many should we replinish?"
        }
      ])
      .then(function(answer) {
        // get the information of the chosen item
        //make this specific to your problem

        var chosenItem;
        for (var i = 0; i < results.length; i++) {
          if (results[i].product_name === answer.choice) {
            chosenItem = results[i];
          }
        }

        // determine there was enough stock in the database for the request
        if (isNaN(answer.amount) === false) {
          var newAmount = parseInt(chosenItem.stock_quantity) + parseInt(answer.amount);
          console.log(newAmount + " " + chosenItem.product_name + "s are now in stock.");
          // item was high enough, so update db, let the user know, and start over
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: newAmount
              },
              {
                item_id: chosenItem.item_id
              }
            ],
            function(error) {
              if (error) throw err;
              console.log('\n');
              start();
            }
          );
        }
        else {
          // item wasn't high enough, so apologize and start over
          console.log("ERROR. Please input a number.");
          start();
        }
      });
  });
}
