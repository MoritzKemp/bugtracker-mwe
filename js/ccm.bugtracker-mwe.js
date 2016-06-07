/*
 * ccm-component implementing a bugtracker feature.
 */

ccm.component({
    name: 'bugtracker-mwe',
    config: {
        html    : [ccm.store, {local: 'js/templates.json'}],
        store   : [ccm.store, {local: 'js/bugs.json'}],
        style   : [ccm.load, 'css/bug.css']
    },
    Instance: function(){
        
        var self = this;
        self.render = function(callback){
            var element = ccm.helper.element(self);
            
            // Rendern der Grundstrutkur
            element.html(ccm.helper.html(self.html.get('main')));
            var overview = ccm.helper.find(self, '.bugs-overview');
                       
            // Get bugs from store
            self.store.get('bugs', function (dataset){
                
                //Render bugs
                var i=0;
                while(dataset[i]){
                    
                    // Create html and wrap in to a jQery object
                    var newBug = $(ccm.helper.html(
                        self.html.get('bug'), 
                        {
                            subscriber : dataset[i].subscriber,
                            description: dataset[i].description,
                            status: dataset[i].state,
                            name: dataset[i].name
                        }
                    ));
                    
                    tagDiv = newBug.find(".tags");
                    
                    // Get stored tags
                    var tags = dataset[i].tags;
                    var j=0;
                    while(tags[j]){
                        
                        var newTag = $( ccm.helper.html(
                            self.html.get('bugTag'),
                            {
                                tagName: tags[j].tagname
                            }
                        ));
                        newTag.appendTo(tagDiv);
                        j++;
                    }
                    
                    // Append it to overview
                    newBug.appendTo(overview);
                    
                    i++;
                }
                
            });
            if(callback) callback();
        };
        self.addBug = function(){
        }
    }
});