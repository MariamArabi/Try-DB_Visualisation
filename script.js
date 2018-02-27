var MAX_SELECTED_PLANTS = 5;

var svgA = d3.select(".a svg");
var svgC = d3.select(".c svg");

var colors = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeSet3.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([+svgA.attr("width"), +svgA.attr("height")])
    .round(true)
    .paddingInner(1);

var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'hidden tooltip');

var selectedPlants = [];

d3.dsv(",", "data/nutriments.csv", function (data) {
    data.AvK = +data.AvK;
    data.AvN = +data.AvN;
    data.AvP = +data.AvP;
    data.AvMoisture = +data.AvMoisture;
    data.total = data.AvK + data.AvN + data.AvP;

    return data;

}).then(function(data) {
    console.log(data);
	initButtons(data);
	displayTreemap(data, "AvK");
});

function updatePlants() {

	console.log(selectedPlants)

	plantWidth = +svgC.attr("width") / 5 - 10;

	var selection = svgC.selectAll("rect")
		.data(selectedPlants);
		selection.exit()
		.remove();

	selection.enter()
		.each( function(d) {
			console.log("Enter : " + d);
		})
		.append("rect")
        .attr("x", function(d, i) {
            return (i * (plantWidth + 10));
        })
        .attr("y", 0)
        .attr("width" , plantWidth)
        .attr("height", 190)
		.attr("fill", "#000");
}

function selectPlant(plant) {

    if (selectedPlants.includes(plant)) {
        index = selectedPlants.indexOf(plant);
        selectedPlants.splice(index, 1);
    } else if (selectedPlants.length < MAX_SELECTED_PLANTS) {
        selectedPlants.push(plant);
    } else {
        alert("Can't select more than " + MAX_SELECTED_PLANTS + " plants")
    }

    svgA.selectAll("rect")
        .filter(function (d) {
            return selectedPlants.includes(d.data);
        })
        .attr("fill", "red");

	svgA.selectAll("rect")
        .filter(function (d) {
            return !selectedPlants.includes(d.data);
        })
        .attr("fill", function(d) {
            return color(d.parent.id);
        });

    updatePlants();
}

function initButtons(data) {
    d3.select(".b")
    .append("button")
    .text("Average P")
    .on("click", function() {
        updateTreemap(data, "AvP");
    });

    d3.select(".b")
    .append("button")
    .text("Average K")
    .on("click", function() {
        updateTreemap(data, "AvK");
    });

    d3.select(".b")
    .append("button")
    .text("Average N")
    .on("click", function() {
        updateTreemap(data, "AvN");
    });

    d3.select(".b")
    .append("button")
    .text("Average Moisture")
    .on("click", function() {
        updateTreemap(data, "AvMoisture");
    });
}

function displayTreemap(data, variable) {

    var stratified = d3.stratify()
        .id(function(d) { return d.Name; })
        .parentId(function(d) { return d.CropCategory; })
        (data);

    var root = stratified
        .sum(function(d) { return d[variable]; })
        .sort(function(a, b) { return b[variable] - a[variable]; });

    treemap(root);

    console.log(root.leaves())

    var cell = svgA.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("id", function(d) { return d.id })
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", function(d) { return d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("fill", function(d) {
            return color(d.parent.id);
        })
        .on("mouseover", function(d) {
            onMouseOver(d);

            d3.select(this)
                .style("opacity", "0.5");
        })
        .on("mouseout", function(d) {
            onMouseOut(d);

            d3.select(this)
                .style("opacity", "1.0");
        })
        .on("click", function(d) {
            selectPlant(d.data);
        });

    /*cell.append("text")
        .text(function(d) { return d.id; })
        .attr("y", function(d) { return 20; })
        .attr("x", function(d) { return 5; });*/
}

function updateTreemap(data, variable) {

    var stratified = d3.stratify()
        .id(function(d) { return d.Name; })
        .parentId(function(d) { return d.CropCategory; })
        (data);

    var root = stratified
        .sum(function(d) { return d[variable]; })
        .sort(function(a, b) { return b[variable] - a[variable]; });

    treemap(root);

    svgA.selectAll("g")
        .data(root.leaves())
        .transition()
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    svgA.selectAll("rect")
        .data(root.leaves())
        .transition()
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
}

function onMouseOver(element) {

    var mouse = d3.mouse(svgA.node()).map(function (d) {
        return parseInt(d);
    });

    tooltip.classed('hidden', false)
        .attr('style', 'left:' + (mouse[0] + 15) +
        'px; top:' + (mouse[1] - 35) + 'px')
        .html(element.id);
}

function onMouseOut(element) {
    tooltip.classed('hidden', true);
}
