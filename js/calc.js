function hasOffhand() {
	return $('#offHandAPS').floatVal() > 0;
}

function baseWeaponDamage(hand) {
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
	var avgDmg = baseWeaponDamage('mainHand');
	if (hasOffhand())
		avgDmg = (avgDmg + baseWeaponDamage('offHand')) / 2;
	return avgDmg;
}

function FitLDamage(hand) {
	return baseWeaponDamage(hand) * (1 + (0.3 * APS(hand)));
}

function averageFitLWeaponDamage() {
	var avgDmg = FitLDamage('mainHand');
	if (hasOffhand())
		avgDmg = (avgDmg + FitLDamage('offHand')) / 2;
	return avgDmg;
}

function FitLUptime() {
	return $('#beacon_of_ytar').prop('checked') ? 0.25 : 0.2;
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
		baseAPS += 0.15;
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
	var CHC = $('#CHC').floatVal();
	var APS = FoTAPS();
	return APS * CHC * 1.25 + APS * CHC * 0.75 * ($('#targets').floatVal() - 1);
}

function FoTCoefficient() {
	return 1.1 * (1 + $('#FoTBonus').floatVal()) * (1 + $('#lightningSkillBonus').floatVal());
}

function TCCoefficient() {
	return 0.35 * (1 + $('#FoTBonus').floatVal()) * (1 + $('#lightningSkillBonus').floatVal());
}

function SWCoefficient() {
	return 0.6 * (1 + $('#SWBonus').floatVal());
}

function cycloneCoefficient() {
	return 0.26 * (1 + $('#SWBonus').floatVal()) * (1 + $('#lightningSkillBonus').floatVal());
}

function baseAverageDamage(FitLActive) {
	if (FitLActive)
		return averageFitLWeaponDamage() * dexMultiplier() * critMultiplier() * buffMultiplier();
	else
		return averageWeaponDamage() * dexMultiplier() * critMultiplier() * buffMultiplier();
}

function FoTDPS(FitLActive) {
	var base = baseAverageDamage(FitLActive);
	var APS = FoTAPS();
	var primaryTargetDPS = base * APS * (FoTCoefficient() + TCCoefficient());
	var secondaryTargetDPS = base * APS * (FoTCoefficient() / 3 + TCCoefficient());
	return primaryTargetDPS + secondaryTargetDPS * ($('#targets').floatVal() - 1);
}

function SWDPS(FitLActive) {
	var base = baseAverageDamage(FitLActive);
	var APS = averageAPS();
	var DPS = base * APS * SWCoefficient();
	return DPS * $('#targets').floatVal();
}

function cycloneDPS(FitLActive) {
	var base = baseAverageDamage(FitLActive);
	return base * cycloneCoefficient() * 6 * cyclonesPerSecond();
}

DPSParts = [FoTDPS, SWDPS, cycloneDPS];

function totalFoTDPS() {
	return FoTDPS(false) * 0.8 + FoTDPS(true) * 0.2;
}

function totalSWDPS() {
	return SWDPS(false) * 0.8 + SWDPS(true) * 0.2;
}

function totalCycloneDPS() {
	return cycloneDPS(false) * 0.8 + cycloneDPS(true) * 0.2;
}

function DPS() {
	var totalDPS = 0;
	var uptime = FitLUptime();
	var downtime = 1 - uptime;
	DPSParts.forEach(function(part) {
		totalDPS += part(false) * downtime;
		totalDPS += part(true) * uptime;
	});
	return totalDPS;
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
	var totalDPS = DPS();
	var FoT = totalFoTDPS();
	var SW = totalSWDPS();
	var cyclone = totalCycloneDPS();
	var FoTPercent = FoT / totalDPS;
	var SWPercent = SW / totalDPS;
	var cyclonePercent = cyclone / totalDPS;

	$('#DPS').val(commaFormat(totalDPS, 2));
	
	$('#FoTDPS').val(commaFormat(FoT, 2));
	$('#SWDPS').val(commaFormat(SW, 2));
	$('#cycloneDPS').val(commaFormat(cyclone, 2));
	
	$('#FoTDPSPercent').val(percentFormat(FoTPercent, 2));
	$('#SWDPSPercent').val(percentFormat(SWPercent, 2));
	$('#cycloneDPSPercent').val(percentFormat(cyclonePercent, 2));
	
	var HP = maxHP();
	var mitigation = DR();
	var effectiveHealth = HP / (1 - mitigation);
	var ratio = effectiveHealth / HP;
	
	$('#EHP').val(commaFormat(effectiveHealth, 2));
	$('#HP').val(commaFormat(HP));
	$('#mitigation').val(percentFormat(mitigation, 2));
	$('#EHPRatio').val("1:" + commaFormat(ratio, 2));
}