/*
 * ccm-component implementing a bugtracker feature.
 */

ccm.component({
    name: 'bugtracker-mwe',
    config: {
        html        : [ccm.store, {local: 'js/templates.json'}],
        store       : [ccm.store, {local: 'js/bugs.json'}],
        remoteStore : [ccm.store, {store: 'bugtracker', url: 'http://ccm2.inf.h-brs.de/index.js' }],
        key         : 'bugtracker',
        style       : [ccm.load, 'css/bug.css']
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
                            name        : dataset[i].name,
                        }
                    ));

                    // Append it to overview
                    newBug.appendTo(overview);
                    i++;
                }
            }
            
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
            }
            
            // Call build functions to actually build the view
            self.store.get('bugs', buildOverview);
            
            //Private onclick function for status header
            $('.current-status-header').click(function(){
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
                    return;
                }
            });
            
            self.store.get(function(result){
               self.remoteStore.set(result, function(response){
                   console.log(response);
               }); 
            });

            self.remoteStore.get(self.key, function(result){
                console.log(result);
            });
            
            if(callback) callback();
        }
    }
});