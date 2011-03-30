/**
*	hashr Firefox Extension
*	@version: 1.0
*	@author Copyright 2008-2009 Rogerio Vicente, <http://rogeriopvl.com>
*
*	Report any bugs or suggestions to rogeriopvl ([at]) gmail
*
*	This file is part of hashr.
*
*	hashr is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	hashr is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.
*
*	You should have received a copy of the GNU General Public License
*	along with hashr.  If not, see <http://www.gnu.org/licenses/>.
*
*/

window.addEventListener("load", function() { hashrExtension.init(); }, false);


var hashrExtension = {
	
	xmlhttp: null,

	init: function() {
		var firstRun = true;

		// get the extension preferences
		var Prefs = Components.classes["@mozilla.org/preferences-service;1"]
    		.getService(Components.interfaces.nsIPrefService);
		Prefs = Prefs.getBranch("extensions.hashr.");

		try {
			firstRun = Prefs.getBoolPref("first_run");
		}
		catch(e) {}
		finally {
			if (firstRun) {
				Prefs.setBoolPref("first_run", false);
				
				// add the hashr button to the toolbar
				var navToolbar = document.getElementById("nav-bar")
				navToolbar.insertItem("hashr-statusbarpanel"); 
				navToolbar.setAttribute("currentset", navToolbar.currentSet);
				document.persist("nav-bar", "currentset");

				try {
					BrowserToolboxCustomizeDone(true);
				}
				catch (e) {}
			}
		}

		// hide the hashr toolbar on start
		var tbar = document.getElementById("hashrToolbar");
		if (tbar) { tbar.collapsed = true; }
	},

	make_hash: function (event) {
	
		hashrExtension.xmlhttp = new hashrExtension.getXMLObject();
	
		var getdate = new Date(); //caching prevention
	
		if (hashrExtension.xmlhttp) {
	 		var str = document.getElementById("hashrStr").value;
			var hashtype = document.getElementById("hashtype").value;

			hashrExtension.xmlhttp.open ("POST","http://rogeriopvl.com/hashr/api2/hash", true);
			hashrExtension.xmlhttp.onreadystatechange = hashrExtension.handleServerResponse;
			hashrExtension.xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    		hashrExtension.xmlhttp.send("str=" + str + "&hashtype=" + hashtype + "&client_app=firefox");
		}
	},

	getXMLObject: function() {
		var xmlhttp = false;
		xmlhttp = new XMLHttpRequest();
	
   		return xmlhttp;  //returning the ajax object created
	},

	handleServerResponse: function() {

		document.getElementById("hashrStr").setAttribute("size", "30");
		document.getElementById("hashrResult").setAttribute ("value", "Loading...");
		document.getElementById("hashrResult").setAttribute ("hidden", "false");
		document.getElementById("hashrClipboard").setAttribute("hidden", "false");

		if (hashrExtension.xmlhttp.readyState == 4) {
    			if(hashrExtension.xmlhttp.status == 200) {
					document.getElementById("hashrResult").setAttribute ("value", hashrExtension.xmlhttp.responseText);			
     			}
    			else {
       		 		document.getElementById("hashrResult").setAttribute("value", "Error contacting server, please retry.");
    			}
		}
	},

	//adds the calculated hash to the clipboard
	add_clipboard: function() {
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
			getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(document.getElementById("hashrResult").value);	
		hashrExtension.show_copied();
	},

	// show a copied message in the toolbar
	show_copied: function() {
		var copiedLabel = document.getElementById('copied');
		if (copiedLabel) { return false; }

		var copyContainer = document.getElementById('copyContainer');
		var newElement = document.createElement('label');
		newElement.setAttribute('id', 'copied');
		newElement.setAttribute('value', 'Copied!');
		copyContainer.appendChild(newElement);

		// only show the copied message for 4 seconds
		 window.setTimeout(function(){
			 var element = document.getElementById('copied');
			 if(element){
				 element.parentNode.removeChild(element);
			 }
		 }, 4000);
	},

	//gets the toolbar to it's initial state (this is actually a fix)
	resetToolbar: function() {
		document.getElementById("hashrStr").setAttribute("size", "80");
		document.getElementById("hashrResult").setAttribute ("value", "");
		document.getElementById("hashrResult").setAttribute ("hidden", "true");
		document.getElementById("hashrClipboard").setAttribute("hidden", "true");
	},

	// shows / hides the hashr toolbar
	show_hide: function() {
		var tbar = document.getElementById("hashrToolbar");
		if (tbar.collapsed == true)
			tbar.collapsed = false;
		else {
			tbar.collapsed = true;
			hashrExtension.resetToolbar();
		}
	},
};
