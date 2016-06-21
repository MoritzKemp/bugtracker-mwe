/*
 * ccm-component implementing a bugtracker feature.
 */

ccm.component({
    name: 'bugtrackerMwe',
    config: {
        html        : [ccm.store, {local: '../js/templates.json'}],
        remoteStore : [ccm.store, {store: 'bugtracker', url: 'http://ccm2.inf.h-brs.de/index.js' }],
        key         : 'bugtracker',
        style       : [ccm.load, '../css/bug.css']
    },
    
    Instance: function(){
        
        var self = this;
        
        self.render = function(callback){
            
            var element = ccm.helper.element(self);
            
            //Private function which builds the overview and attaches bugs
            var buildOverview = function(dataset){
                
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
                        descriptionTitle: "Describtion"
                    }
                ));
                header.appendTo(overview);
                
                //Render all bugs
                var i=0;
                while(dataset[i]){

                    // Create html and wrap in to a jQery object
                    var newBug = $(ccm.helper.html(
                        self.html.get('bug'), 
                        {
                            bugId       : dataset[i].bugId,
                            subscriber  : dataset[i].subscriber,
                            description : dataset[i].description,
                            status      : dataset[i].state,
                            name        : dataset[i].name
                        }
                    ));
                    // Append it to overview
                    newBug.appendTo(overview);
                    i++;
                }
                
                // Append button to overview
                newBug.append("<br><button class='new_bug'>Neuer Bug</button>");
                newBug.find('.new_bug').click(function () {
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
                // Ein Beispiel:
                var newBug = {};
//                newBug.bugId = "te3";
//                newBug.context = "testcontext";
//                newBug.subsriber = "hans";
//                newBug.name = "Database broken!";
//                newBug.state = "open";
//                newBug.description = "test description ";
//                self.storeBug(newBug);
            };
            
            // Fetch data from DB and build overview
            self.remoteStore.get(function(response){
                buildOverview(response);   
                //Add status header action
                $('.current-status-header').click(onClickStatusHeader);
                //Add new bug submit action
                // Not the correct button, just checking if it works
                $('.new_bug').click(onClickAddBug);
            });
            
            if(callback) callback();
        };
        
        //Public function to save bugs into remote database
        self.storeBug = function(bug){
            
            self.remoteStore.set({
                "bugId"         : bug.bugId,
                "context"       : bug.context,
                "subscriber"    : bug.subscriber,
                "description"   : bug.description,
                "name"          : bug.name,
                "state"         : bug.state
            });
        };
        
        self.removeBug = function(bug){
            if (!bug.key){
                console.log('Bug not persisted yet. Skip delete request.');
            }
            self.remoteStore.del(bug.key, function(){
                console.log('Delete bug with key ' + bug.key);
            });
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
    }
});
