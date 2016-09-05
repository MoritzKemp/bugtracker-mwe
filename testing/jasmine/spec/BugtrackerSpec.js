describe("Bugtracker ccm-component", function(){
    var bugtracker_local;
    describe("when ccm-framework is ready", function(){
        beforeEach(function(done){
            ccm.instance('../js/ccm.bugtrackerMwe.js', {
                html: [ccm.store, {local: '../js/templates.json'}],
                style       : [ccm.load, '../css/bug.css'],
                element     : $('#component-wrapper'),
                inputComponent: [
                    ccm.instance, 
                    'https://akless.github.io/ccm-components/resources/input/ccm.input.js',
                    {
                        data: {
                            store: [ccm.store, '../js/input.json'],
                            key: 'bugInput'
                        },
                        fieldset: 'Add bug',
                        onFinish: function(bug){
                            var index = (new Date()).getTime();
                            bug.bugId = index;
                            bug.key = index;

                            var event = $.Event('newBug', {'bug': bug});
                            $('.input-comp-area').trigger(event);
                        }
                    }
                ]
            },
            function(bugtrackerInstance){
                bugtracker_local = bugtrackerInstance;
                done();
            });
        });
    
        it("should be able to create by the ccm framework local", function(){
            expect(bugtracker_local).not.toBe(null);
            expect(bugtracker_local).toBeDefined();
        });
        
        describe("when the bugtracker instance is ready", function(){
            
            //Test data
            var bugs = [
                {
                    "key"           : "11",
                    "bugId"         : "1",
                    "priority"      : "low",
                    "context"       : "my specific url",
                    "subscriber"    : "John Doe",
                    "description"   : "my bug description",
                    "name"          : "Bug No. 1",
                    "state"         : "open"
                },
                {
                    "key"           : "12",
                    "bugId"         : "2",
                    "priority"      : "high",
                    "context"       : "my specific url 2",
                    "description"   : "my bug description 2, somewhat a little bit longer.",
                    "subscriber"    : "Fred",
                    "name"          : "Bug No. 2",
                    "state"         : "pending"
                },
                {
                    "key"           : "13",
                    "bugId"         : "3",
                    "priority"      : "low",
                    "context"       : "my specific url 3",
                    "description"   : "my bug description 3, somewhat a little bit longer.",
                    "subscriber"    : "Nasenbär",
                    "name"          : "Bug No. 22",
                    "state"         : "closed"
                }
            ];    
            
            beforeEach(function(){
                //Setup remote database stub
                spyOn(bugtracker_local.remoteStore, "set");
                spyOn(bugtracker_local.remoteStore, "del");
                spyOn(bugtracker_local.remoteStore, "get");
            });
            
            it("should be able to add a new bug", function(){
                bugtracker_local.storeBug(bugs[0]);
                expect(bugtracker_local.remoteStore.set).toHaveBeenCalledWith(
                        bugs[0], 
                        jasmine.any(Function) // any callback, we dont care
                    );
            });
            
            it("should be able to remove a valid bug", function(){
                bugtracker_local.removeBug(bugs[0]);
                expect(bugtracker_local.remoteStore.del).toHaveBeenCalledWith(
                        bugs[0].key, 
                        jasmine.any(Function)
                    );
            });
            
            it("should be able to remove a invalid bug", function(){
                var bugWithNoKey = {
                    "bugId"         : "3",
                    "priority"      : "low",
                    "context"       : "my specific url 3",
                    "description"   : "my bug description 3, somewhat a little bit longer.",
                    "subscriber"    : "Nasenbär",
                    "name"          : "Bug No. 22",
                    "state"         : "closed"
                }
                bugtracker_local.removeBug(bugWithNoKey);
                expect(bugtracker_local.remoteStore.del).not.toHaveBeenCalled();
            });
        });
    });
});

