/*
 * ccm-component implementing a bugtracker feature.
 */

ccm.component({
    name: 'bugtracker-mwe',
    config: {
        html: [ccm.store, {local: 'js/templates.json'}],
        store: [ccm.store, {local: 'js/bugs.json'}],
        style: [ccm.load, 'css/bug.css']
    },
    Instance: function () {

        var self = this;
        self.render = function (callback) {
            var element = ccm.helper.element(self);

            //Function which builds the overview and attaches bugs
            buildOverview = function (dataset) {

                // Rendern der Grundstrutkur
                element.html(ccm.helper.html(self.html.get('main')));
                var overview = ccm.helper.find(self, '.bugs-overview');

                //Render bugs
                var i = 0;
                while (dataset[i]) {

                    // Create html and wrap in to a jQery object
                    var newBug = $(ccm.helper.html(
                        self.html.get('bug'),
                        {
                            subscriber: dataset[i].subscriber,
                            description: dataset[i].description,
                            status: dataset[i].state,
                            name: dataset[i].name
                        }
                    ));

                    tagDiv = newBug.find(".tags");

                    // Get stored tags
                    var tags = dataset[i].tags;
                    var j = 0;
                    while (tags[j]) {

                        var newTag = $(ccm.helper.html(
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
                //var bugs_overview_div = e
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

                //overview.html('.return_to_overwiew').click(self.render(buildOverview()));
            };


            // Call build functions to actually build the view
            self.store.get('bugs', buildOverview);

            if (callback) callback();
        }
    }
});