/**
 * @overview ccm-component implementing a bugtracker feature
 * @author Johan Martens <johann.martens@smail.inf.h-brs.de>
 * @author Moritz Kemp <moritz.kemp@smail.inf.h-brs.de>
 * @license The MIT License (MIT) Test addition
 */

/* Register given ccm-bugtracker component in ccm-framework */
ccm.component(
    
    /**
     * @lends ccm.components.bugtrackerMwe
     */
    {

        name: 'bugtrackerMwe',

        /**
         * Default component configuration
         * @type {ccm.components.bugtrackerMwe.types.config}
         * @property {ccm.store} html Basic HTML-Template
         * @property {ccm.store} remoteStore Remote Database configuration
         * @property {ccm.store} store Template for bug input mask
         * @property {ccm.load} style CSS style loading
         * @property {ccm.load} icons Load remote icon fonts from cloudflare
         * @property {ccm.instance} user Load ccm-component <i>user</i> from remote ccm market
         */
        config: {
            html: [ccm.store, {local: '../js/templates.json'}],
            remoteStore: [ccm.store, {store: 'bugtracker', url: 'http://ccm2.inf.h-brs.de/index.js'}],
            style:  [ccm.load, '../css/bug.css'],
            inputDataStore: [ccm.store, '../js/input.json'],
            icons:  [ccm.load, 'http://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.4.0/css/font-awesome.min.css'],
            user:   [ccm.instance, 'https://kaul.inf.h-brs.de/ccm/components/user2.js']
        },

        /**
         * @constructs ccm.components.bugtrackerMwe
         */
        Instance: function () {

            /**
             * Own context
             * @alias ccm.components.bugtrackerMwe#
             */
            var self = this;

            /**
             * State variable to indicate current bug sorting order
             * @private
             */
            var bugSorting = 0;

            /**
             * Render bugtracker overview and set action handlers
             * @public
             */
            self.render = function (callback) {

                // Get own website area
                var element = ccm.helper.element(self);

                /**
                 * Builds the overview and attaches given bugs
                 * @param bugs array of bugs to display
                 * @private
                 */
                var buildOverview = function (bugs) {

                    // Render base structure from html template
                    element.html(ccm.helper.html(self.html.get('main')));
                    var overview = ccm.helper.find(self, '.bugs-overview');

                    // Attach header
                    var header = $(ccm.helper.html(
                        self.html.get('header'),
                        {
                            bugIdTitle: "ID",
                            priorityTitle: "Priority",
                            nameTitle: "Title",
                            statusTitle: "State",
                            subscriberTitle: "Subscriber",
                            descriptionTitle: "Description"
                        }
                    ));
                    header.appendTo(overview);

                    //Sort bugs
                    sortStatus(bugs);

                    //Render all bugs
                    var i = 0;
                    while (bugs[i]) {
                        // Create html and wrap in to a jQery object
                        var newBug = $(ccm.helper.html(
                            self.html.get('bug'),
                            {
                                bugId: bugs[i].bugId,
                                priority: bugs[i].priority,
                                subscriber: bugs[i].subscriber,
                                description: bugs[i].description,
                                status: bugs[i].state,
                                name: bugs[i].name
                            }
                        ));
                        newBug.appendTo(overview);
                        i++;
                    }
                };

                /**
                 * Builds the input mask to add new bugs
                 * @private
                 */
                var buildBugInputView = function() {
                    
                    /*Create the input ccm-component*/
                    inputComponent = ccm.instance(
                        'https://akless.github.io/ccm-components/resources/input/ccm.input.js', 
                        {
                            data: {
                                store: self.inputDataStore,
                                key: 'bugs'
                            },
                            onFinish: function(bug){
                                var index = (new Date()).getTime();
                                bug.bugId = index;
                                bug.key = index;
                                self.storeBug(bug)
                            }
                        },
                        function(inputComponent){
                            var overview = element.find('.bugs-overview');
                            overview.append("<br><button class='new_bug'>Add bug</button>");

                            overview.find('.new_bug').click(function () {
                                    inputComponent.render();

                                    //Set history to enable Browser-Back-Btn
                                    location.hash = 'newBug';
                                }
                            );
                        }
                    );                    
                };

                /**
                 * Action handler when user clicks on status header
                 * @private
                 */
                var onClickStatusHeader = function () {
                    if (bugSorting === 0) {   
                        bugSorting = 1;
                    } else {
                        bugSorting = 0;
                    }
                    self.render();
                };

                /**
                 * @summary Action handler when user clicks on icon to remove a bug
                 * @private
                 */
                var onClickRemoveBug = function () {

                    // Search for bug id
                    var bugId = $(this).parents('.bug').children('.bug-id').html();
                    // Search bug by id and delete
                    self.remoteStore.get(function (bugs) {
                        bugs.forEach(function (elem) {

                            if (
                                elem.bugId === bugId ||
                                elem.bugId.toString() === bugId
                            ) {
                                self.removeBug(elem);
                            }
                        });
                        self.render();
                    });

                };

                /**
                 * Action handler when user clicks on icon to edit a bug
                 * @private
                 */
                var onClickEditBug = function () {

                    // Search for bug id
                    var bugRow = $(this).parents('.bug');
                    var bugId = bugRow.children('.bug-id').html();

                    var bug = {};

                    self.remoteStore.get(function (bugs) {
                        bugs.forEach(function (elem) {
                            if (
                                elem.bugId === bugId ||
                                elem.bugId.toString() === bugId
                            ) {
                                bug = elem;
                            }
                        });
                        //Create editable row from template
                        var editableRow = $(ccm.helper.html(
                            self.html.get('bug-edit'),
                            {
                                bugId: bug.bugId,
                                priority: bug.priority,
                                subscriber: bug.subscriber,
                                description: bug.description,
                                name: bug.name
                            }
                        ));

                        //Attach actions
                        editableRow.find('.fa-check').click(function () {
                            bug.state = editableRow.find('#states').val();
                            bug.description = editableRow.find('#description-text').val();
                            self.remoteStore.set(bug, function () {
                                self.render();
                            });
                        });

                        editableRow.find('.fa-trash').click(function () {
                            self.render();
                        });

                        //Replace row
                        bugRow.replaceWith(editableRow);
                    });
                };

                // Actually build overview
                self.remoteStore.get(function (response) {
                    buildOverview(response);
                    buildBugInputView();
                    
                    //Assign action handlers after rendering
                    $('.current-status-header').click(this, onClickStatusHeader);
                    $('.bug-buttons > .fa-edit').click(this, onClickEditBug);
                    $('.bug-buttons > .fa-remove').click(this, onClickRemoveBug);
                });

                if (callback) callback();
            };

            /**
             * Public function to save bugs into remote database
             * @param {BugObject} bug Bug to be added to the bugtracker's database
             * @public
             */
            self.storeBug = function(bug){
                self.remoteStore.set(bug, function(response){
                    console.log(response)
                });
            };

            /**
             * Public function to remove given bug in remote database
             * @param {BugObject} bug Bug to be removed from the bugtracker's database
             * @public
             */
            self.removeBug = function (bug) {
                if (!bug.key) {
                    console.log('Bug not persisted yet. Skip delete request.');
                }
                self.remoteStore.del(bug.key, function () {
                    console.log('Delete bug with key ' + bug.key);
                });
            };

            /**
             * Private function to sort given bugs after their status
             * @param bugs array of bugs to sort
             * @private
             */
            var sortStatus = function (bugs) {

                var compareBugs = function(a, b){
                    if(a.state === "open" || b.state === "closed") return -1;
                    else if(a.state === b.state) return 0;
                    else return 1;
                }
                
                var reverseOrder = function(a,b) {return (compareBugs(a,b)*-1)}
                
                if (bugSorting === 0) {
                    $('#status-mark').removeClass('fa-sort-up');
                    $('#status-mark').addClass('fa-sort-down');
                    bugs.sort(compareBugs);
                } else {
                    $('#status-mark').removeClass('fa-sort-down');
                    $('#status-mark').addClass('fa-sort-up');
                    bugs.sort(reverseOrder);
                }
            };

            /*
             * For development purpose, resets remote database
             */
            var resetDatabase = function () {

                // Delete content
                self.remoteStore.get(function (response) {
                    response.forEach(function (elm) {
                        self.remoteStore.del(elm.key, function (resp) {
                        });
                    });
                });

                // set test content
//                self.remoteStore.set(
//                    {
//                        "bugId": "3442",
//                        "context": "my specific url",
//                        "subscriber": "Moritz",
//                        "description": "my bug description",
//                        "name": "Bug No. 1",
//                        "state": "pending"
//                    }
//                );
//
//                self.remoteStore.set(
//                    {
//                        "bugId": "6552",
//                        "context": "my specific url 2",
//                        "description": "my bug description 2, somewhat a little bit longer.",
//                        "subscriber": "Fred",
//                        "name": "Bug No. 2",
//                        "state": "pending"
//                    }
//                );
//
//                self.remoteStore.set(
//                    {
//                        "bugId": "2252",
//                        "context": "my specific url 2",
//                        "description": "my bug description 2, somewhat a little bit longer.",
//                        "subscriber": "Nasenbär",
//                        "name": "Bug No. 22",
//                        "state": "closed"
//                    }
//                );
            };

            /**
             * If current view is the bug in put mask and
             * the <i>Back</i>-Button is pressed, return to bug overview.
             */
            window.onhashchange = function(){
                console.log(location.hash);
                if(location.hash !== '#newBug'){
                    self.render();
                }
            };
    }
});

/**
 * JSON structure of a bug
 * @typedef {Object} BugObject - A single bug
 * @property {string} bugId - Unique bug index
 * @property {string} priority - Bug's priority, typical low or high
 * @property {string} context - URL or other description of context in which the bug appears
 * @property {string} subscriber - Person who reports the bug
 * @property {string} description -  Description of the bug
 * @property {string} name - Name of the bug, very short descritpion
 * @property {string} state - Current state of the bug, may be open, pending or closed
 * @example <caption> A valid bug object </caption>
 * {
 *  "bugId"         : "33de",
 *  "priority"      : "mittel",
 *  "context"       : "my specific url",
 *  "subscriber"    : "Moritz",
 *  "description"   : "my bug description",
 *  "name"          : "Bug No. 1",
 *  "state"         : "pending"
 * }
 */