module.exports = {
 	getToneAnalyzer: function() {
		var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
		var tone_analyzer = new ToneAnalyzerV3({
		  username: '',
		  password: '',
		  version_date: '2017-09-21',
		});

		return tone_analyzer;
	},
	getLanguageTranslator: function(){
		var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
		var languageTranslator = new LanguageTranslatorV2({
		  username: '',
		  password: ''
		});

		return languageTranslator;
	}
};