Todos = new Mongo.Collection('todos');
Lists = new Mongo.Collection('lists');
Friends = new Mongo.Collection('friends');


// router configure

Router.route('/register');
Router.route('/login');
Router.route('/list/:_id', {
    name: 'listPage',
    template: 'listPage',
    data: function() {
        var currentList = this.params._id;
        var currentUser = Meteor.userId();
        return Lists.findOne({
            _id: currentList,
            createdBy: currentUser
        });
    },
    onRun: function() {
        console.log("You triggered 'onRun' for 'listPage' route.");
        this.next();
    },
    onRerun: function() {
        console.log("You triggered 'onRerun' for 'listPage' route.");
    },
    onBeforeAction: function() {
        console.log("You triggered 'onBeforeAction' for 'listPage' route.");
        var currentUser = Meteor.userId();
        if (currentUser) {
            this.next();
        } else {
            this.render("login");
        }
    },
    onAfterAction: function() {
        console.log("You triggered 'onAfterAction' for 'listPage' route.");
    },
    onStop: function() {
        console.log("You triggered 'onStop' for 'listPage' route.");
    }
});
Router.route('/', {
    name: 'home',
    template: 'home'

});
Router.configure({
    layoutTemplate: 'main'

});

if (Meteor.isClient) {


    // todos template helper
    Template.todos.helpers({
        todos: function(event) {
            var currentList = this._id;
            return Todos.find({
                listId: currentList
            }, {
                sort: {
                    createdAt: -1
                }
            });
        }

    });
    // todoItem template helpers
    Template.todoItem.helpers({
        'checked': function() {
            var isCompleted = this.completed;
            if (isCompleted) {
                return "checked";
            } else {
                return "";
            }

        }

    });
    Template.todosCount.helpers({
        'totalTodos': function() {
            return Todos.find().count();

        },
        'completedTodos': function() {
            return Todos.find({
                completed: true
            }).count();
        },
        'perecentCompleted': function() {
            var totalTodos = Todos.find().count();
            var completedTodos = Todos.find({
                completed: true
            }).count();
            return Math.round((completedTodos / totalTodos * 100));
        }

    });
    Template.lists.helpers({

        'list': function() {
            return Lists.find({}, {
                sort: {
                    name: 1
                }
            });
        }
    });

    Template.addTodo.events({
        'submit form': function(event) {
            event.preventDefault();
            var todoName = $('[name = "todoName"]').val();
            var currentUser = Meteor.userId();
            var currentList = this._id;
            //var todoname = event.target.todoName.value;
            Todos.insert({
                name: todoName,
                completed: false,
                createdAt: new Date(),
                createdBy: currentUser,
                listId: currentList
            });
            $('[name = "todoName"]').val('');

        }

    });

    Template.todoItem.events({
        'click .delete-todo': function(event) {
            event.preventDefault();
            var documentId = this._id;
            var confirm = window.confirm("Delete this task?");
            if (confirm) {
                Todos.remove({
                    _id: documentId
                });
            }
        },
        'keyup [name=todoItem]': function(event) {
            if (event.which == 13 || event.which == 27) {
                $(event.target).blur();
                console.log("You have typed the Return or Escape key")
                console.log(event.which);
            } else {
                var documentId = this._id;
                var todoItem = $(event.target).val();
                //  var todItem = $([name = todItem]).val(); // jquery
                //  var todItem = event.target.value; // non-jQuery
                Todos.update({
                    _id: documentId
                }, {
                    $set: {
                        name: todoItem
                    }
                });

                console.log("Task changed to:" + todoItem);
            }
        },
        'change [type =checkbox]': function() {
            var documentId = this._id;
            var isCompleted = this.completed;
            if (isCompleted) {
                Todos.update({
                    _id: documentId
                }, {
                    $set: {
                        completed: false
                    }
                });
                console.log("Task marked as incomplete");
            } else {
                Todos.update({
                    _id: documentId
                }, {
                    $set: {
                        completed: true
                    }
                });
                console.log("Task marked as complete");

            }
        }

    });
    Template.addList.events({
        'submit form': function(event) {
            event.preventDefault();
            var listName = $('[name=listName]').val();
            var currentUser = Meteor.userId();
            Lists.insert({
                name: listName,
                createdBy: currentUser
            }, function(error, results) {
                Router.go('listPage', {
                    _id: results
                });
            });
            $('[name=listName]').val('');
        },
    });
    Template.lists.events({
        'click .delete-lists': function(event) {
            event.preventDefault();
            var currentList = this._id;
            var confirm = window.confirm("Delete this list?");
            if (confirm) {
                Lists.remove({
                    _id: currentList
                });
            }
        },


    });
    Template.register.events({
        'submit form': function(event) {
            event.preventDefault();
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Accounts.createUser({
                email: email,
                password: password,
                function(error) {
                    if (error) {
                        if (error.reason == "Email already exists.") {
                            validator.showErrors({
                                email: "That email already belongs to a registered user."
                            });
                        }
                    } else {
                        Router.go('home'); // Redirect user if registration succeeds
                    }
                }
            });
            Router.go('home');
        }
    });

    Template.navigation.events({
        'click .logout': function(event) {
            event.preventDefault();
            Meteor.logout();
            Router.go('login');

        }

    });
    Template.login.events({
        'submit form': function() {
            event.preventDefault();
            var email = $('[name = email]').val();
            var password = $('[name = password]').val();
            Meteor.loginWithPassword(email, password, function(error) {
                if (error) {
                    console.log(error.reason);
                } else {
                    var currentRoute = Router.current().route.getName();
                    if (currentRoute == "login") {
                        Router.go("home");
                    }

                }
            });

        }
    });
    Template.login.onRendered(function() {
        var validator = $('.login').validate({
            submitHandler: function(event) {
                var email = $('[name=email]').val();
                var password = $('[name=password]').val();
                Meteor.loginWithPassword(email, password, function(error) {
                    if (error) {
                        if (error.reason == "User not found") {
                            validator.showErrors({
                                email: "That email doesn't belong to a registered user."
                            });
                        }
                        if (error.reason == "Incorrect password") {
                            validator.showErrors({
                                password: "You entered an incorrect password."
                            });
                        }
                    } else {
                        var currentRoute = Router.current().route.getName();
                        if (currentRoute == "login") {
                            Router.go("home");
                        }
                    }
                });
            }
        });
    });
    Template.register.onRendered(function() {
        $('.register').validate({
            submitHandler: function(event) {
                var email = $('[name=email]').val();
                var password = $('[name=password]').val();
                Accounts.createUser({
                    email: email,
                    password: password
                }, function(error) {
                    if (error) {
                        if (error.reason == "Email already exists.") {
                            validator.showErrors({
                                email: "That email already belongs to a registered user."
                            });
                        }
                    } else {
                        Router.go("home");
                    }
                });
            }
        });
    });

}

if (Meteor.isServer) {}

//
// meteor add twbs:bootstrap
// meteor add fortawesome:fontawesome
// meteor add iron:router
// meteor add accounts-ui accounts-password
// meteor add themeteorchef:jquery-validation
// Meteor.users.find().fetch();
// PlayersList.find().fetch();
// PlayersList.find().count();
// PlayersList.find().fetch()[i];
// PlayersList.findOne();
// PlayersList.findOne({_id:currentPlaeyer});
// PlayersList.insert({});
// PlayersList.remove({});
// PlayersList.update({});
