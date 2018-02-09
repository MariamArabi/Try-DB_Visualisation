var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

d3.tsv("/bdd/nutriment.tsv", function(data) {
  console.log(data[0].x);
});

var svg = d3.select("body").append("svg")
  .attr("width", 960)
  .attr("height", 500);

var data = [22, 32, 21, 23, 10, 22, 11, 19, 30, 50, 19, 30, 50, 19, 30, 87];

var y = d3.scaleLinear()
	.domain([0, d3.max(data)])
	.range([0, 100]);

	data.forEach(function(d, i) {

    svg.append("rect")
			.attr("width", 50)
			.attr("height", y(d))
			.attr("x", i * 55)
			.attr("y", 200 - y(d));

})
