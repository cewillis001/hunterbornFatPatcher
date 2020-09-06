/* global ngapp, xelib, registerPatcher, patcherUrl */


registerPatcher({
    info: info,
    // array of the game modes your patcher works with
    // see docs://Development/APIs/xelib/Setup for a list of game modes
    gameModes: [xelib.gmSSE],
    settings: {
        // The label is what gets displayed as the settings tab's label
        label: 'Hunterborn Fat Patcher',
        // if you set hide to true the settings tab will not be displayed
        //hide: true,
        templateUrl: `${patcherUrl}/partials/settings.html`,
        // controller function for your patcher's settings tab.
        // this is where you put any extra data binding/functions that you
        // need to access through angular on the settings tab.
        controller: function($scope) {
            let patcherSettings = $scope.settings.hunterbornFatPatcher;

            // function defined on the scope, gets called when the user
            // clicks the Show Message button via ng-click="showMessage()"
            $scope.showMessage = function() {
            };
        },
        // default settings for your patcher.  use the patchFileName setting if
        // you want to use a unique patch file for your patcher instead of the
        // default zPatch.esp plugin file.  (using zPatch.esp is recommended)
        defaultSettings: {
            fatMultiplier: 3,
            patchFileName: 'hunterbornFatPatch.esp',
            ignoredFiles: []
        }
    },
    requiredFiles: ['Hunterborn.esp'],
    execute: (patchFile, helpers, settings, locals) => ({
        initialize: function() {
            locals.date = new Date();
            locals.hunterbornHandle = xelib.FileByName('Hunterborn.esp');
            helpers.logMessage(`Multiplying troll fat by: ${settings.fatMultiplier}`);
        },
        // required: array of process blocks. each process block should have both
        // a load and a patch function.
        process: [
            {
                load: {
                    // get craftable objects
                    signature: 'COBJ',
                    filter: function(record) {
                        // assume Hunterborn knows about animal fat already
                        if (xelib.ElementEquals(xelib.GetElementFile(record), locals.hunterbornHandle)) {
                            return false;
                        }
                        // check it has items at all - some recipes don't
                        if (!xelib.HasElement(record, 'Items')) {
                            return false;
                        }
                        // obviously we only care about recipes with troll fat ingredients
                        if (!xelib.HasItem(record, 'TrollFat')) {
                            return false;
                        }
                        // is troll in the recipe name? probably wouldn't make sense to substitute
                        if (xelib.EditorID(record).toLowerCase().includes('troll')) {
                            return false;
                        }
                        // one last check - is one of the other ingredients a troll skull?
                        // probably wouldn't make sense to substitute
                        if (xelib.HasItem(record, 'BoneTrollSkull01')) {
                            return false;
                        }
                        return true;
                    }
                },
                patch: function(trollFatRecipe) {
                    // copy recipe
                    let animalFatRecipe = xelib.CopyElement(trollFatRecipe, patchFile, true);
                    // rename
                    var oldEDID = xelib.EditorID(trollFatRecipe);
                    xelib.SetValue(animalFatRecipe, 'EDID', "BRY_FAT_PATCH_".concat(oldEDID));
                    // get troll fat info
                    var fatItem = xelib.GetItem(animalFatRecipe, 'TrollFat');
                    var newCount = xelib.GetUIntValue(fatItem, 'CNTO\\Count') * settings.fatMultiplier;

                    // add animal fat
                    xelib.AddItem(animalFatRecipe, '_DS_Misc_AnimalFat', newCount.toString());

                    // remove troll fat
                    xelib.RemoveItem(animalFatRecipe, 'TrollFat');
                }
            }
        ],
        finalize: function() {
            let diff = new Date() - locals.date;
            let seconds = Math.round(diff / 1000);
            let minutes = Math.floor(seconds / 60);
            helpers.logMessage('Elapsed minutes:' + minutes);
            helpers.logMessage('Elapsed seconds:' + (seconds - (minutes * 60)));
        }
    })
});