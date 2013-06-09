var ELEMENTAL_DAMAGE_TYPES = ["Arcane", "Cold", "Fire", "Lightning", "Holy", "Poison"];

var paragonLevel = 0;
var sets = {};
var items = {};
var skills = {};
var cachedAttributes = {};

//wraps jquery.getJSON to force jsonp, bypassing cross-domain restrictions
function getJSON(url, data, success) {
	return $.getJSON(url + '?callback=?', data, success);
}

function cacheAttribute(attribute, value) {
	sanitizedAttribute = attribute.replace('_Item', '');
	if (sanitizedAttribute in cachedAttributes)
		cachedAttributes[sanitizedAttribute] += value['min'];
	else
		cachedAttributes[sanitizedAttribute] = value['min'];
}

function cacheItem(item) {
	if ('set' in item) {
		var set = item['set'];
		var setName = set['name'];
		if (setName in sets) {
			sets[setName]['equipped'] += 1;
		}
		else {
			sets[setName] = set;
			sets[setName]['equipped'] = 1;
		}
		
		set['ranks'].forEach(function(rank) {
			if (sets[setName]['equipped'] == rank['required'])
				$.each(rank['attributesRaw'], cacheAttribute);
		});
	}
	$.each(item['attributesRaw'], cacheAttribute);
	item['gems'].forEach(function(gem) {
		$.each(gem['attributesRaw'], cacheAttribute);
	});
}

function sumAttributes() {
	var sum = 0;
	for (i = 0; i < arguments.length; i ++) {
		var arg = arguments[i];
		if (arg in cachedAttributes)
			sum += cachedAttributes[arg];
	}
	return sum;
}

function elementalDamageBonus() {
	var elementalDamageBonus = 0;
	ELEMENTAL_DAMAGE_TYPES.forEach(function(damageType) {
		var attributeString = 'Damage_Type_Percent_Bonus#' + damageType;
		if (attributeString in cachedAttributes)
			elementalDamageBonus += cachedAttributes[attributeString];
	});
	return elementalDamageBonus;
}

function bonusMin() {
	return sumAttributes('Damage_Min#Physical', 'Damage_Bonus_Min#Physical');
}

function bonusMax() {
	return sumAttributes('Damage_Max#Physical', 'Damage_Min#Physical', 'Damage_Delta#Physical');
}

function weaponAPS(item) {
	return item['attributesRaw']['Attacks_Per_Second_Item']['min'];
}

function weaponBonusAPS(item) {
	if ('Attacks_Per_Second_Item_Bonus' in item['attributesRaw'])
		return item['attributesRaw']['Attacks_Per_Second_Item_Bonus']['min'];
	else
		return 0;
}

function physMin(item) {
	return item['minDamage']['min'];
}

function physMax(item) {
	return item['maxDamage']['min'];
}

function mainHandAPS() {
	return weaponAPS(items['mainHand']);
}

function offHandAPS() {
	return weaponAPS(items['offHand']);
}

function mainHandBonusAPS() {
	return weaponBonusAPS(items['mainHand']);
}

function offHandBonusAPS() {
	return weaponBonusAPS(items['offHand']);
}

function mainHandPhysMin() {
	return physMin(items['mainHand']);
}

function offHandPhysMin() {
	return physMin(items['offHand']);
}

function mainHandPhysMax() {
	return physMax(items['mainHand']);
}

function offHandPhysMax() {
	return physMax(items['offHand']);
}

function baseMin(item) {
	var elemMin = 0;
	ELEMENTAL_DAMAGE_TYPES.forEach(function(damageType) {
		var minWeaponDamageString = 'Damage_Weapon_Min#' + damageType;
		if (minWeaponDamageString in item['attributesRaw'])
			elemMin += item['attributesRaw'][minWeaponDamageString]['min'];
	});
	return physMin(item) + elemMin;
}

function mainHandBaseMin() {
	return baseMin(items['mainHand']);
}

function offHandBaseMin() {
	return baseMin(items['offHand']);
}

function baseMax(item) {
	var elemMax = 0;
	ELEMENTAL_DAMAGE_TYPES.forEach(function(damageType) {
		var minWeaponDamageString = 'Damage_Weapon_Min#' + damageType;
		var deltaWeaponDamageString = 'Damage_Weapon_Delta#' + damageType;
		if (minWeaponDamageString in item['attributesRaw'])
			elemMax += item['attributesRaw'][minWeaponDamageString]['min'] + item['attributesRaw'][deltaWeaponDamageString]['min'];
	});
	return physMax(item) + elemMax;
}

function mainHandBaseMax() {
	return baseMax(items['mainHand']);
}

function offHandBaseMax() {
	return baseMax(items['offHand']);
}

function strength() {
	return 67 + paragonLevel + sumAttributes('Strength');
}

function dexterity() {
	return 187 + paragonLevel * 3 + sumAttributes('Dexterity');
}

function intelligence() {
	return 67 + paragonLevel + sumAttributes('Intelligence');
}

function vitality() {
	return 127 + paragonLevel * 2 + sumAttributes('Vitality');
}

function IAS() {
	return sumAttributes('Attacks_Per_Second_Percent');
}

function CHC() {
	return 0.05 + sumAttributes('Crit_Percent_Bonus_Capped');
}

function CHD() {
	return 0.5 + sumAttributes('Crit_Damage_Percent');
}

function lightningSkillBonus() {
	return sumAttributes('Damage_Dealt_Percent_Bonus#Lightning');
}

function FoTBonus() {
	return sumAttributes('Power_Damage_Percent_Bonus#Monk_FistsOfThunder');
}

function SWBonus() {
	return sumAttributes('Power_Damage_Percent_Bonus#Monk_SweepingWind');
}

function HPPercentBonus() {
	return sumAttributes('Hitpoints_Max_Percent_Bonus');
}

function resist() {
	var allRes = sumAttributes('Resistance_All');
	var maxRes = allRes;
	ELEMENTAL_DAMAGE_TYPES.forEach(function(type) {
		var attributeString = 'Resistance#' + type;
		if (attributeString in cachedAttributes && cachedAttributes[attributeString] > maxRes)
			maxRes = cachedAttributes[attributeString];
	});
	return allRes + maxRes + intelligence() / 10;
}

function armor() {
	return sumAttributes('Armor', 'Armor_Bonus') + strength() + dexterity() / 2;
}

function getProfileURL() {
	return 'http://' + $('#region').val() + '.battle.net/api/d3/profile/' + $('#battletag').val().replace('#', '-') + '/';
}

function crawlProfile() {
	getJSON(getProfileURL(), function(profileData) {
		$.each(profileData['heroes'], function(key, heroData) {
		
			if (heroData['class'] == 'monk') {
				heroString = (heroData['hardcore'] ? '[HC]' : '[SC]') + '[' + heroData['level'] + '] ' + heroData['name'];
				$('#heroSelection').append($('<option>', {
					value: heroData['id'],
					text : heroString
				}));
			}
		});
		$('#heroes').show();
	});
}

function reset() {
	items = {};
	sets = {};
	skills = {};
	cachedAttributes = {};
}

function loadHero() {
	reset();
	var asyncCalls = [];
	
	heroURL = getProfileURL() + 'hero/' + $('#heroSelection').val();
	getJSON(heroURL, function(heroData) {
		paragonLevel = heroData['paragonLevel'];
		skills = heroData['skills'];
		$.each(heroData['items'], function(slot, itemDataStub) {
			itemURL = 'http://us.battle.net/api/d3/data/' + itemDataStub['tooltipParams'];
			asyncCalls.push(
				getJSON(itemURL, function(itemData) {
					items[slot] = itemData;
					cacheItem(items[slot]);
				})
			);
		});
		$.when.apply($, asyncCalls).then(setFields);
	});
}

function setFields() {
	$.each($('.stats :input'), function(index, fieldSelector) {
		var field = $(fieldSelector);
		var value = eval(field.attr('id'))();
		var precision = field.attr('data-precision');
		field.val(value.toFixed(precision));
	});
	
	$('input:checked').prop('checked', false);
	var primarySkills = 0;
	skills['active'].forEach(function(skill) {
		$('#' + skill['skill']['name'].replaceAll(' ', '_').toLowerCase()).prop('checked', true);
		$('#' + skill['rune']['name'].replaceAll(' ', '_').toLowerCase()).prop('checked', true);
		if (skill['skill']['categorySlug'] == 'primary')
			primarySkills += 1;
	});
	skills['passive'].forEach(function(skill) {
		$('#' + skill['skill']['name'].replaceAll(' ', '_').toLowerCase()).prop('checked', true);
	});
	$('#combination_strike_stacks').val(primarySkills);
}