/*
 * ccm-component implementing a bugtracker feature.
 */

ccm.component({
    name: 'bugtrackerMwe',
    config: {
        html        : [ccm.store, {local: '../js/templates.json'}],
        remoteStore : [ccm.store, {store: 'bugtracker', url: 'http://ccm2.inf.h-brs.de/index.js' }],
        key         : 'bugtracker',
        style       : [ccm.load, '../css/bug.css'],
        icons       : [ccm.load, 'http://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.4.0/css/font-awesome.min.css']
    },
    
    Instance: function(){
        
        var self = this;
        
        self.render = function(callback){
            //resetDatabase();
            var element = ccm.helper.element(self);

            //Private function which builds the overview and attaches bugs
            var buildOverview = function(bugs){
                
                // Rendern der Grundstrutkur
                element.html(ccm.helper.html(self.html.get('main')));
                var overview = ccm.helper.find(self, '.bugs-overview');
                
                // Attach header
                var header = $(ccm.helper.html(
                    self.html.get('header'),
                    {
                        bugIdTitle: "ID",
                        nameTitle: "Name",
                        statusTitle: "Status",
                        subscriberTitle: "Subscriber",
                        descriptionTitle: "Description"
                    }
                ));
                header.appendTo(overview);
                
                //Render all bugs
                var i=0;
                while(bugs[i]){
                    // Create html and wrap in to a jQery object
                    var newBug = $(ccm.helper.html(
                        self.html.get('bug'), 
                        {
                            bugId       : bugs[i].bugId,
                            subscriber  : bugs[i].subscriber,
                            description : bugs[i].description,
                            status      : bugs[i].state,
                            name        : bugs[i].name
                        }
                    ));
                    // Append it to overview
                    newBug.appendTo(overview);
                    i++;
                }
                
                // Append button to overview
                overview.append("<br><button class='new_bug'>Neuer Bug</button>");
                overview.find('.new_bug').click(function () {
                    overview.html("<h2>Add a new bug ...</h2>" + "<form>" +
                        "<label for='bug_subject'>Subject</label>"
                        + "<textarea id='subject' name='ta_subject' cols='20' rows='5' required></textarea>"
                        + "<br>"
                        + "<label for='bug_status'>Status</label>"
                        + " <select name='Status'>"
                        + "<option value='neu'>Neu</option>"
                        + "<option value='in_bearb'>in Bearbeitung</option>"
                        + "<option value='umgesetzt'>Umgesetzt</option>"
                        + "</select>"
                        + "<br>"
                        + "<label for='bug_prio'>Priorität</label>"
                        + " <select name='Priorität'>"
                        + "<option value='niedrig'>niedrig</option>"
                        + "<option value='mittel'>mittel</option>"
                        + "<option value='hoch'>hoch</option>"
                        + "</select>"
                        + "<br>"
                        + "<button class='return_to_overview'>Bug-Überblick</button>"
                        + "</form>");
                });
            };
            
            var onClickStatusHeader = function(){
                if ($(this).hasClass('no-order'))
                {
                    $(this).removeClass('no-order');
                    $(this).addClass('asc');
                    sortStatus(0);
                    return;
                }
                if ($(this).hasClass('asc'))
                {
                    $(this).removeClass('asc');
                    $(this).addClass('desc');
                    sortStatus(1);
                    return;
                }
                if ($(this).hasClass('desc'))
                {
                    $(this).removeClass('desc');
                    $(this).addClass('asc');
                    sortStatus(0);
                }
            };
            
            var onClickAddBug = function(){
                console.log('Add new Bug!')
                //self.storeBug(newBug);
            };
            
            var onClickRemoveBug = function(){
                
                // Search for bug id
                var bugId = $(this).parents('.bug').children('.bug-id').html();
                
                // Search bug by id and delete
                self.remoteStore.get(function(bugs){
                    bugs.forEach(function(elem){
                        
                        if(
                            elem.bugId === bugId ||
                            elem.bugId.toString() === bugId    
                        ){ 
                            self.removeBug(elem);
                        }
                    });
                    self.render();
                });
                
            };
            
            var onClickEditBug = function(){
                
                // Search for bug id
                var bugRow = $(this).parents('.bug');
                var bugId = bugRow.children('.bug-id').html();
                
                var bug = {};
                
                self.remoteStore.get(function(bugs){
                    bugs.forEach(function(elem){
                        if(
                            elem.bugId === bugId ||
                            elem.bugId.toString() === bugId    
                        ){
                            bug = elem;
                        }
                    });
                    //Create editable row from template
                    var editableRow = $(ccm.helper.html(
                            self.html.get('bug-edit'), 
                            {
                                bugId       : bug.bugId,
                                subscriber  : bug.subscriber,
                                description : bug.description,
                                name        : bug.name
                            }
                        ));

                    //Attach actions
                    editableRow.find('.fa-check').click(function(){
                        bug.state = editableRow.find('#states').val();
                        console.log(bug);
                        self.remoteStore.set(bug, function(){
                           self.render(); 
                        });
                    });
                    
                    editableRow.find('.fa-trash').click(function(){
                        self.render();
                    });
                    
                    //Replace row
                    bugRow.replaceWith(editableRow);
                });
            };
            
            // Actually build overview
            self.remoteStore.get(function(response){
                buildOverview(response);
                //Assign action handlers after rendering
                $('.current-status-header').click(onClickStatusHeader);
                $('.bug-buttons > .fa-edit').click(this, onClickEditBug);
                $('.bug-buttons > .fa-remove').click(this, onClickRemoveBug);
            });
            
            if(callback) callback();
        };
        
        //Public function to save bugs into remote database
        self.storeBug = function(bug){
            self.remoteStore.set(bug, function(response){
                console.log(response)
            });
            
        };
        
        self.removeBug = function(bug){
            if (!bug.key){
                console.log('Bug not persisted yet. Skip delete request.');
            } else {
                // Delete remote
                self.remoteStore.del(bug.key, function(delResponse){
                    console.log("Delete bug.");
                });
            }
        };
        
        //Private function to sort bugs after their status
        var sortStatus = function(order){
            //Get overview container
            var overview = $('.bugs-overview');
            //Get all bugs and remove them
            var bugs = overview.find('.bug');
            bugs.remove();

            if(order === 0)
            {   
                order = ['open', 'pending', 'closed'];
            } else {
                order = ['closed', 'pending', 'open'];
            }

            order.forEach(function(key){
                bugs.each(function(){
                    if($(this).find('.current-status').html() === key)
                    {
                        $(this).appendTo(overview);
                    }     
                });
            });
        };
        
        var resetDatabase = function(){
            
            // Delete content
            self.remoteStore.get(function(response){
                response.forEach(function(elm){
                    self.remoteStore.del(elm.key, function(resp){
                });
                });
            });
            
            // set test content
            self.remoteStore.set(
                 {
                    "bugId"         : "3442",
                    "context"       : "my specific url",
                    "subscriber"    : "Moritz",
                    "description"   : "my bug description",
                    "name"          : "Bug No. 1",
                    "state"         : "pending"
                }
             );
            
            self.remoteStore.set(
                 {
                    "bugId"         : "6552",
                    "context"       : "my specific url 2",
                    "description"   : "my bug description 2, somewhat a little bit longer.",
                    "subscriber"    : "Fred",
                    "name"          : "Bug No. 2",
                    "state"         : "pending"
                }
             );
            
            self.remoteStore.set(
                 {
                    "bugId"         : "2252",
                    "context"       : "my specific url 2",
                    "description"   : "my bug description 2, somewhat a little bit longer.",
                    "subscriber"    : "Nasenbär",
                    "name"          : "Bug No. 22",
                    "state"         : "closed"
                }
             );      
        };
    }
});
