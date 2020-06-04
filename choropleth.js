const margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
}

const svgHeight = 800 - margin.top - margin.bottom
const svgWidth = 1500 - margin.left - margin.right

const translateX = 50

const urlUS_EDUCATION = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'
const urlUS_COUNTY = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'

let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);


const svg = d3.select('.scatterplot')
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)

const unemployment = d3.map()

const path = d3.geoPath()

const x = d3.scaleLinear()
    .domain([2.6, 75.1])
    .rangeRound([600, 860])

const color = d3.scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1-2.6)/8))
    .range(d3.schemeGreens[9]);

const g = svg.append("g")
    .attr("class", "key")
    .attr("id", "legend")
    .attr("transform", "translate(0,40)");

g.selectAll('rect')
    .data(color.range().map(d => {
        d = color.invertExtent(d)
        if(d[0] == null) d[0] = x.domain()[0]
        if(d[1] == null) d[1] = x.domain()[1]
        return d
    }))
    .enter()
    .append('rect')
    .attr('height', 8)
    .attr('x', d => x(d[0]))
    .attr('width', d => x(d[1]) - x(d[0]) )
    .attr('fill', d => color(d[0]))

g.append('text')
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")

g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(x => Math.round(x) + '%')
        .tickValues(color.domain())
    )
    .select('.domain')
    .remove()

const ready = ( [us, education] ) => {

    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("class", "county")
        .attr("data-fips", function(d) {
        return d.id
        })
        .attr("data-education", function(d) {
            var result = education.filter(obj => obj.fips == d.id)
            if(result[0]){
                return result[0].bachelorsOrHigher
            }
            //could not find a matching fips id in the data
            console.log('could find data for: ', d.id);
            return 0
        })
        .attr("fill", function(d) { 
            var result = education.filter(obj => obj.fips == d.id)
            if(result[0]){
                return color(result[0].bachelorsOrHigher)
            }
            return color(0)
        })
        .attr("d", path)
        .on("mouseover", function(d) {      
            tooltip.style("opacity", .9); 
            tooltip.html(function() {
                var result = education.filter(function( obj ) {
                return obj.fips == d.id;
                });
                if(result[0]){
                return result[0]['area_name'] + ', ' + result[0]['state'] + ': ' + result[0].bachelorsOrHigher + '%'
                }
                return 0
            })
        .attr("data-education", function() {
            var result = education.filter(function( obj ) {
                return obj.fips == d.id;
            });
            if(result[0]){
                return result[0].bachelorsOrHigher
            }
            return 0
        })
        .style("left", (d3.event.pageX + 10) + "px") 
        .style("top", (d3.event.pageY - 28) + "px"); }) 
        .on("mouseout", function(d) { 
        tooltip.style("opacity", 0); 
        });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("class", "states")
        .attr("d", path);
}

Promise.all([urlUS_COUNTY, urlUS_EDUCATION].map(url => d3.json(url)))
    .then(ready)