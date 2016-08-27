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
            key: 'demo',
            store:  [ccm.store, '../js/input.json'],
            style:  [ccm.load, '../css/bug.css'],
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

                    // Rendern der Grundstrutkur
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
                    bugs = sortStatus(bugs);

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

                    var overview = element.find('.bugs-overview');
                    overview.append("<br><button class='new_bug'>Neuer Bug</button>");

                    overview.find('.new_bug').click(function () {
                            self.store.get(self.key, function (dataset) {

                                if (dataset === null)
                                    return self.store.set(
                                        {key: self.key},
                                        function (dataset) {
                                            self.key = dataset.key;
                                            element.remove();
                                            self.render();
                                        });
                                var html = [{tag: 'table', inner: []}];

                                if (dataset.inputs)
                                    if (Array.isArray(dataset.inputs))
                                        for (var i = 0; i < dataset.inputs.length; i++)
                                            addInput(dataset.inputs[i]);
                                    else
                                        addInput(dataset.inputs);

                                if (dataset.fieldset) {
                                    html = {tag: 'fieldset', inner: html};
                                    if (typeof dataset.fieldset === 'string')
                                        html.inner.unshift({tag: 'legend', inner: dataset.fieldset});
                                }

                                if (dataset.form) {
                                    if (dataset.form === true) dataset.form = {button: true};
                                    html = {tag: 'form', onsubmit: dataset.form.onsubmit, inner: html};
                                    if (dataset.form.button) {
                                        var button = {tag: 'input', type: 'submit', value: dataset.form.button};
                                        if (button.value === true) delete button.value;
                                        if (dataset.fieldset)
                                            html.inner.inner.push(button);
                                        else
                                            html.inner.push(button);
                                    }
                                }

                                element.html(ccm.helper.html(html, function () {

                                    var newData = ccm.helper.formData(jQuery(this));
                                    var uniq = (new Date()).getTime();
                                    var bug = {
                                        "bugId"         : uniq,
                                        "priority"      : newData.priority,
                                        "context"       : "my specific url",
                                        "subscriber"    : newData.subscriber,
                                        "description"   : newData.story,
                                        "name"          : newData.titel,
                                        "state"         : newData.status
                                    };
                                    self.storeBug(bug);
                                    self.render();
                                    return false;

                                }));

                                function addInput(input) {

                                    var label = input.label || input.name;
                                    delete input.label;

                                    switch (input.input) {
                                        case 'select':
                                        case 'textarea':
                                            input.tag = input.input;
                                            break;
                                        default:
                                            input.tag = 'input';
                                            input.type = input.input;
                                    }


                                    if (input.input === 'select') {
                                        input.inner = input.options;
                                        delete input.options;
                                        for (var i = 0; i < input.inner.length; i++) {
                                            input.inner[i].tag = 'option';
                                            input.inner[i].inner = input.inner[i].caption || input.inner[i].value;
                                            delete input.inner[i].caption;
                                        }
                                    }

                                    delete input.input;

                                    html[0].inner.push({
                                        tag: 'tr',
                                        inner: [
                                            {
                                                tag: 'td',
                                                inner: label
                                            },
                                            {
                                                tag: 'td',
                                                inner: input
                                            }
                                        ]
                                    });
                                }
                            });

                            //Set history to enable Browser-Back-Btn
                            location.hash = 'newBug';
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
                    console.log(bugId);
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
             * @return array of sorted bugs
             * @private
             */
            var sortStatus = function (bugs) {

                var sortedBugs = [];
                if (bugSorting === 0) {
                    order = ['open', 'pending', 'closed'];
                    $('#status-mark').removeClass('fa-sort-up');
                    $('#status-mark').addClass('fa-sort-down');
                } else {
                    order = ['closed', 'pending', 'open'];
                    $('#status-mark').removeClass('fa-sort-down');
                    $('#status-mark').addClass('fa-sort-up');
                }

                order.forEach(function (key) {
                    bugs.forEach(function (elem) {
                        if (elem.state === key) {
                            sortedBugs.push(elem);
                        }
                    });
                });
                return sortedBugs;
            };

            /**
             * For development purpose, resets remote database
             * @private
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
                self.remoteStore.set(
                    {
                        "bugId": "3442",
                        "context": "my specific url",
                        "subscriber": "Moritz",
                        "description": "my bug description",
                        "name": "Bug No. 1",
                        "state": "pending"
                    }
                );

                self.remoteStore.set(
                    {
                        "bugId": "6552",
                        "context": "my specific url 2",
                        "description": "my bug description 2, somewhat a little bit longer.",
                        "subscriber": "Fred",
                        "name": "Bug No. 2",
                        "state": "pending"
                    }
                );

                self.remoteStore.set(
                    {
                        "bugId": "2252",
                        "context": "my specific url 2",
                        "description": "my bug description 2, somewhat a little bit longer.",
                        "subscriber": "Nasenbär",
                        "name": "Bug No. 22",
                        "state": "closed"
                    }
                );
            };

            //Return to bug overview if Browser-Back-Btn is pressed
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