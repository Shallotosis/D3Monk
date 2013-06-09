function hasOffhand() {
	return $('#offHandAPS').floatVal() > 0;
}

function baseDamage(hand) {
	var physMin = $('#' + hand + 'PhysMin').floatVal() + $('#bonusMin').floatVal();
	var physMax = $('#' + hand + 'PhysMax').floatVal() + $('#bonusMax').floatVal();
	var physAvg = (physMin + physMax) / 2;
	var elementalDamageBonus = physAvg * ($('#elementalDamageBonus').floatVal());
	
	var baseMin = $('#' + hand + 'BaseMin').floatVal() + $('#bonusMin').floatVal();
	var baseMax = $('#' + hand + 'BaseMax').floatVal() + $('#bonusMax').floatVal();
	var baseAvg = (baseMin + baseMax) / 2;
	
	return baseAvg + elementalDamageBonus;
}

function averageWeaponDamage() {
	var avgDmg = baseDamage('mainHand');
	if (hasOffhand())
		avgDmg = (avgDmg + baseDamage('offHand')) / 2;
	return avgDmg;
}

function FitLDamage(hand) {
	return baseDamage(hand) * (1 + (0.3 * APS(hand)));
}

function averageFitLWeaponDamage() {
	var avgDmg = FitLDamage('mainHand');
	if (hasOffhand())
		avgDmg = (avgDmg + FitLDamage('offHand')) / 2;
	return avgDmg;
}

function dexMultiplier() {
	return 1 + $('#dexterity').floatVal() / 100;
}

function critMultiplier() {
	return 1 + ($('#CHC').floatVal() * $('#CHD').floatVal());
}

function attackSpeedMultiplier() {
	var multi = 1 + $('#IAS').floatVal();
	if (hasOffhand())
		multi += 0.15;
	return multi;
}

function bonusAPS() {
	return $('#mainHandBonusAPS').floatVal() + $('#offHandBonusAPS').floatVal();
}

function buffMultiplier() {
	var multi = 1;
	$.each($('.buffs :input:checked'), function(index, buff) {
		if (buff.id == "combination_strike")
			multi += $('#combination_strike_stacks :selected').floatAttr('data-buffvalue');
		multi += $(buff).floatAttr('data-buffvalue');
	});
	return multi;
}

function APS(hand) {
	var baseAPS = $('#' + hand + 'APS').floatVal() + bonusAPS();
	if ($('#blazing_fists').prop('checked'))
		return (baseAPS + 0.15) * attackSpeedMultiplier();
	else
		return baseAPS * attackSpeedMultiplier();
}

function averageAPS() {
	var avgAPS = APS('mainHand');
	if (hasOffhand())
		avgAPS = (avgAPS + APS('offHand')) / 2;
	return avgAPS;
}
 
 function FoTAPS() {
	return averageAPS() * 1.5;
}

function cyclonesPerSecond() {
	return FoTAPS() * $('#CHC').floatVal() * 1.25;
}

function FoTCoefficient() {
	return 1.45 * (1 + $('#FoTBonus').floatVal()) * (1 + $('#lightningSkillBonus').floatVal());
}

function SWCoefficient() {
	return 0.6 * (1 + $('#SWBonus').floatVal());
}

function cycloneCoefficient() {
	return 0.26 * (1 + $('#SWBonus').floatVal()) * (1 + $('#lightningSkillBonus').floatVal());
}

function FoTDPS() {
	return averageWeaponDamage() * dexMultiplier() * critMultiplier() * FoTAPS() * FoTCoefficient() * buffMultiplier();
}

function SWDPS() {
	return averageWeaponDamage() * dexMultiplier() * critMultiplier() * averageAPS() * SWCoefficient() * buffMultiplier();
}

function cycloneDPS() {
	return averageWeaponDamage() * dexMultiplier() * critMultiplier() * cycloneCoefficient() * buffMultiplier() * 6;
}

function FitLFoTDPS() {
	return averageFitLWeaponDamage() * dexMultiplier() * critMultiplier() * FoTAPS() * FoTCoefficient() * buffMultiplier();
}

function FitLSWDPS() {
	return averageFitLWeaponDamage() * dexMultiplier() * critMultiplier() * averageAPS() * SWCoefficient() * buffMultiplier();
}

function FitLCycloneDPS() {
	return averageFitLWeaponDamage() * dexMultiplier() * critMultiplier() * cycloneCoefficient()  * buffMultiplier() * 6;
}

function nonFitLDPS() {
	return FoTDPS() + SWDPS() + cycloneDPS() * cyclonesPerSecond();
}

function FitLDPS() {
	return FitLFoTDPS() + FitLSWDPS() + FitLCycloneDPS() * cyclonesPerSecond();
}

function DPS() {
	return nonFitLDPS() * 0.8 + FitLDPS() * 0.2;
}

function maxHP() {
	return (276 + $('#vitality').floatVal() * 35) * (1 + $('#HPPercentBonus').floatVal());
}

function DR() {
	var armor = $('#armor').floatVal();
	var armorDR = armor / (3150 + armor);
	
	var resist = $('#resist').floatVal();
	var resistDR = resist / (315 + resist);
	
	return 1 - (1 - 0.3) * (1 - armorDR) * (1 - resistDR);
}

function EHP() {
	return maxHP() / (1 - DR());
}

function calculate() {
	$('#DPS').val(commaFormat(DPS().toFixed(2)));
	$('#EHP').val(commaFormat(EHP().toFixed(2)));
}