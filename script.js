// Panel A : Treemap

var svgA = d3.select(".a svg");

var mycolors = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);

var treemap = d3.treemap()
	.tile(d3.treemapResquarify)
	.size([+svgA.attr("width"), +svgA.attr("height")])
	.round(true)
	.paddingInner(1);

var tooltip = d3.select('body')
	.append('div')
	.attr('class', 'hidden tooltip');

// Panel B : Buttons

// Panel C : Selection

var svgC = d3.select(".c svg");
var MAX_SELECTED_PLANTS = 10;
var selectedPlants = [];

// Panel D : Voronoi

var svgD = d3.select(".d svg");
var widthD = +svgD.attr("width");
var heightD = +svgD.attr("height");
var nodePadding = 2.5;

var simulation = d3.forceSimulation()
	.force("forceX", d3.forceX().strength(.01).x(widthD * .5))
	.force("forceY", d3.forceY().strength(.01).y(heightD * .5))
	.force("center", d3.forceCenter().x(widthD * .5).y(heightD * .5));

var voronoi = d3.voronoi()
	.extent([[0, 0], [widthD, heightD]])
	.x(function (d) { return d.x; })
	.y(function (d) { return d.y; });

var voronoiGroup = svgD.append("g")
	.attr("class", "voronoi");

var nodesGroup = svgD.append("g")
	.attr("class", "nodes")

var t = d3.transition()
	.duration(750);

// Data

d3.csv("data/nutriments.csv", function (error, data) {
	if (error) throw error;

	data.forEach(element => {
		element.AvK = +element.AvK;
		element.AvN = +element.AvN;
		element.AvP = +element.AvP;
		element.AvMoisture = +element.AvMoisture;
	});

	initButtons(data);
	displayTreemap(data, "AvK");
});

function updateVoronoi() {

	selectedPlants.forEach(element => {
		element.x = Math.random() * 600;
		element.y = Math.random() * 400;
	})

	console.log(selectedPlants);
	console.log(voronoi(selectedPlants).polygons());

	// transition‚
	var t = d3.transition()
		.duration(750);

	// elements
	var circle, path;

	// JOIN
	path = voronoiGroup.selectAll("path")
		.data(voronoi(selectedPlants).polygons());

	circle = nodesGroup.selectAll("circle")
		.data(selectedPlants, function (d) { return d.Name; });

	// EXIT
	path.exit().remove();
	circle.exit().remove();

	// UPDATE
	path
		.attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; })
		.style("fill", function (d) {
			return mycolors(d.data.CropCategory);
		});

	circle
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; });

	// ENTER
	path.enter().append("path")
		.attr("class", "voronoi")
		.attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; })
		.style("fill", function (d) {
			return mycolors(d.data.CropCategory);
		});

	circle.enter().append("circle")
		.attr("r", 5)
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; });

	simulation
		.nodes(selectedPlants)
		//.force("charge", d3.forceManyBody().strength(-15))
		.force("collide", d3.forceCollide().strength(1).radius(function (d) { return d.AvK * 10 + nodePadding; }).iterations(10))
		.on("tick", function (d) {

			circle = nodesGroup.selectAll("circle")
				.data(selectedPlants, function (d) { return d.Name; });

			circle
				.attr("cx", function (d) { return d.x; })
				.attr("cy", function (d) { return d.y; });

			voronoi
				.x(function (d) { return d.x; })
				.y(function (d) { return d.y; });

			path = voronoiGroup.selectAll("path")
				.data(voronoi(selectedPlants).polygons());
			path.attr("d", function (d) {
				return d ? "M" + d.join("L") + "Z" : null;
			});
		});

	simulation.alpha(1).restart();
}

function updatePlants() {

	//console.log(selectedPlants)

	plantWidth = +svgC.attr("width") / 5 - 10;

	var selection = svgC.selectAll("rect")
		.data(selectedPlants);
	selection.exit()
		.remove();

	selection.enter()
		.each(function (d) {
			//console.log("Enter : " + d);
		})
		.append("rect")
		.attr("x", function (d, i) {
			return (i * (plantWidth + 10));
		})
		.attr("y", 0)
		.attr("width", plantWidth)
		.attr("height", 190)
		.attr("fill", "#222");
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
		.attr("fill", function (d) {
			return mycolors(d.data.CropCategory);
		});

	updatePlants();
	updateVoronoi();
}

function initButtons(data) {
	d3.select(".b")
		.append("button")
		.text("Average P")
		.on("click", function () {
			updateTreemap(data, "AvP");
		});

	d3.select(".b")
		.append("button")
		.text("Average K")
		.on("click", function () {
			updateTreemap(data, "AvK");
		});

	d3.select(".b")
		.append("button")
		.text("Average N")
		.on("click", function () {
			updateTreemap(data, "AvN");
		});

	d3.select(".b")
		.append("button")
		.text("Average Moisture")
		.on("click", function () {
			updateTreemap(data, "AvMoisture");
		});
}

function displayTreemap(data, variable) {

	var stratified = d3.stratify()
		.id(function (d) { return d.Name; })
		.parentId(function (d) { return d.CropCategory; })
		(data);

	var root = stratified
		.sum(function (d) { return d[variable]; })
		.sort(function (a, b) { return b[variable] - a[variable]; });

	treemap(root);

	console.log(root.leaves())

	var cell = svgA.selectAll("g")
		.data(root.leaves())
		.enter()
		.append("g")
		.attr("id", function (d) { return d.id })
		.attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	cell.append("rect")
		.attr("id", function (d) { return d.id; })
		.attr("width", function (d) { return d.x1 - d.x0; })
		.attr("height", function (d) { return d.y1 - d.y0; })
		.attr("fill", function (d) {
			return mycolors(d.data.CropCategory);
		})
		.on("mouseover", function (d) {
			onMouseOver(d);

			d3.select(this)
				.style("opacity", "0.5");
		})
		.on("mouseout", function (d) {
			onMouseOut(d);

			d3.select(this)
				.style("opacity", "1.0");
		})
		.on("click", function (d) {
			selectPlant(d.data);
		});

    /*cell.append("text")
        .text(function(d) { return d.id; })
        .attr("y", function(d) { return 20; })
        .attr("x", function(d) { return 5; });*/
}

function updateTreemap(data, variable) {

	var stratified = d3.stratify()
		.id(function (d) { return d.Name; })
		.parentId(function (d) { return d.CropCategory; })
		(data);

	var root = stratified
		.sum(function (d) { return d[variable]; })
		.sort(function (a, b) { return b[variable] - a[variable]; });

	treemap(root);

	svgA.selectAll("g")
		.data(root.leaves())
		.transition()
		.attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	svgA.selectAll("rect")
		.data(root.leaves())
		.transition()
		.attr("width", function (d) { return d.x1 - d.x0; })
		.attr("height", function (d) { return d.y1 - d.y0; });
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