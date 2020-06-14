define(['qlik','jquery', './libraries/d3/d3', './initialProperties', './properties', 'css!./LineChartWithTableTooltip'], 

function(qlik, $, d3, initProps, props, css){
    return {
        initialProperties: initProps,
        definition: props,
        paint: async function($element, layout){
            //Creating a second cube

            let app = qlik.currApp(this)
            let self = this
            let applicationProperties = await self.backendApi.getProperties()
            let innerCubeMeasureExpression = applicationProperties.qHyperCubeDef.qMeasures[0].qDef.qDef
            let innerCubeDimensionExpression = applicationProperties.qHyperCubeDef.qDimensions[0].qDef.qFieldDefs

            let qHyperCubeDef2 = {
                qDimensions : [
                    { qDef : {qFieldDefs : innerCubeDimensionExpression}}
                                  ],
                qMeasures : [
                    { qDef : {qDef : innerCubeMeasureExpression}}
                            ],
              
                qInitialDataFetch: [{              
                    qWidth: 2,
                    qHeight: 5000          
                }]
                };
            
            let outerCube = await app.createCube(qHyperCubeDef2)
            let outerCubeData = outerCube.layout.qHyperCube.qDataPages[0].qMatrix
            let innerCubeData = layout.qHyperCube.qDataPages[0].qMatrix
            

            //Recreating the canvas
            $element.empty()
            let chart_id = 'chart_' + layout.qInfo.qId
            $element.attr('id', chart_id)
            let svg = d3.select('#' + chart_id)
                .append('svg')
                .attr('width', $element.width())
                .attr('height', $element.height())
            
            let svgHeight = svg.attr('height')*0.85
            let svgWidth = svg.attr('width')*0.85

            //Creating an array for the table data
            let tableData = innerCubeData.map(function (d){
                return {'outerDimension': d[0].qText,
                        'innerDimension': d[1].qText,
                        'measure': d[2].qNum}
            })

            //Drawing the line using the outer cube data (1-st level aggregation)
            let lineData = outerCubeData.map(function (d) {
                // let output = d3.timeParse(d[0].qText)
                // console.log(output)
               return {'dimension' : d[0].qText, 
                        'measure': d[1].qNum, 
                        'index': d[0].qElemNumber}
                    })
                        
            let lineDataMin = d3.extent(lineData, d=> d.measure)[0]
            let lineDataMax = d3.extent(lineData, d=> d.measure)[1]
            
            let yScale = d3.scaleLinear().domain([Math.min(lineDataMin, 0), Math.max(lineDataMax, 0)*1.1]).range([svgHeight, 0])
            let yAxis = d3.axisLeft(yScale).tickSize(-svgWidth)
            svg.append('g')
                .attr('transform', 'translate(30,0)')
                .call(yAxis)
                .attr('class', '.gridline')
                .attr('opacity', 0.2)

            //let xScale = d3.scaleTime().domain(lineData.map(d=> d3.timeParse(d.dimension))).range([30, svgWidth])
            let xScale = d3.scaleBand().domain(lineData.map(d=> d.dimension)).range([30, svgWidth])
            let xAxis = d3.axisBottom(xScale)
            svg.append('g').attr('transform', `translate(0, ${svgHeight})`).call(xAxis)
            
            let xOffset = (xScale(lineData[1].dimension) - xScale(lineData[0].dimension)) / 2

            let line = d3.line()
                    .x(data => xScale(data.dimension))
                    .y(data => yScale(data.measure))

            svg.append('path')
                .attr('transform', `translate(${xOffset},-5)`)
                .attr('d', line(lineData))
                .attr('stroke', 'green')
                .attr('fill', 'none')
            
            svg.selectAll('circle')
                .data(lineData)
                .enter()
                .append('circle').attr('transform', `translate(${xOffset},-5)`)
                .attr('cx', d => xScale(d.dimension))
                .attr('cy', d=>  yScale(d.measure))
                .attr('r', 5)
                .attr('fill', 'green')
                .on('mouseover',showTooltipTable)
                .on('mouseout', function(){
                    d3.selectAll('.table-tooltip').remove()
                })
                .on('click', function(d){
                    current_status = d3.select(this).attr('class')
                    if (current_status === 'selected'){
                        d3.select(this).attr('class', 'not_selected')
                    } else {
                        d3.select(this).attr('class', 'selected')
                    }
                    self.selectValues(0, [d.index], true)
                })

                //functions
            function showTooltipTable (d){
                let filteredTable = [] 
                tableData.forEach(function (table){
                    if (table.outerDimension === d.dimension) {
                       filteredTable.push ([table.innerDimension, table.measure])
                    } else {
                        //pass
                    } 
                })
                filteredTable = filteredTable.sort((a, b)=> d3.descending(a[1], b[1]))   

                let foreignObject = svg.append('foreignObject')
                                .attr('class', 'table-tooltip')
                                .attr('x', d3.mouse(this)[0] + 30 + 'px')
                                .attr('y', d3.mouse(this)[1] + 30 + 'px')
                                .attr('width', 200)
                                .attr('height', 200)
                                .attr('opacity', 1)
                let div = foreignObject.append('xhtml:div')
                                        .append('div').attr('class', 'table-div')
                let table = div.append('table')
                    .attr('class','detail_table')
                    .attr('border', '1')
                let header = table.append('thead')
                let body = table.append('tbody')
                
                body.selectAll('tr')
                    .data(filteredTable)
                    .enter()
                    .append('tr')
                        .selectAll('td')
                        .data(d=> d)
                        .enter()
                        .append('td').text(cell=> cell)   
            }

            
                

        }      
    }
})