/*
Author: Aizaya L. Seco
Date: December 2, 2017
Description: main controller for the optimizer for both ultimate optimizer and efficient transport system
*/

(function() {
    angular
        .module('app')
        .controller('mainController', mainController);

    function mainController($scope) {
        var vm = this;
		vm.objFunction="";
		vm.constraints= [];
		vm.headers=[];
		vm.table=[];
		vm.initialTable=[];
		vm.tables=[];
		vm.isMaximize=true;
		vm.rowsize=0;
		vm.colsize=0;
		vm.headersMin=[];
		vm.isDual=false;
		vm.slackSize=0;
		vm.basicSOlution;
		vm.optimalSolution="";
		vm.varSize=0;
		vm.showTable=false;
		vm.currentPage=0;
		vm.ETS=false;
		//vm.ETS=true; 
		vm.variables=[];
		vm.mSource=0;
		vm.nDestinations=0;
		vm.sources=[];
		vm.destinations=[];
		vm.costs=[];
		vm.labelrows=[];
		vm.labelcols=[];
		vm.destinationType="";
		vm.sourceType="";
		vm.costType="";
		
		vm.solve = solve;
		vm.addConstraint=addConstraint;
		vm.removeConstraint=removeConstraint;
		vm.nextPage=nextPage;
		vm.prevPage= prevPage;
		vm.switchOpt= switchOpt;
		vm.plotGraph=plotGraph;
		vm.next=next;
		vm.solveETS=solveETS;
		
		//pushes at two one constranint
		vm.constraints.push({
				lhs:'',
				inequality:'',
				rhs: ''
			});
		vm.constraints.push({
				lhs:'',
				inequality:'',
				rhs: ''
			});
			
		/* GRAPHING using plotly */
		function plotGraph(){
			if(vm.varSize==2){
				constraints=[];
				angular.copy(vm.constraints, constraints);
				var size=vm.constraints.length;
				x=vm.variables[0];
				y=vm.variables[1];
				var data = [];
				angular.forEach(constraints, function(c,key){
					var lhs= getEquation(c.lhs);
					var rhs= getEquation(c.rhs);
					xPoints=[];//lhs.variables[0][0];
					yPoints=[];//lhs.variables[0][1];
					if(lhs.variables[0].length==1){
						if(lhs.variables[0][0]===x){
							for(i=0;i<20;i++){
								xPoints.push(rhs.constants[0][0]/lhs.constants[0][0]);
								yPoints.push(i);
							}
							
						}else{
							for(i=0;i<20;i++){
								yPoints.push(rhs.constants[0][0]/lhs.constants[0][0]);
								xPoints.push(i);
							}
						}
					}else{
						if(lhs.variables[0][0]===x){
							xPoints.push(rhs.constants[0][0]/lhs.constants[0][0]);
							yPoints.push(0);
							xPoints.push(0);
							yPoints.push(rhs.constants[0][0]/lhs.constants[0][1]);
						}else{
							yPoints.push(rhs.constants[0][0]/lhs.constants[0][0]);
							xPoints.push(0);
							yPoints.push(0);
							xPoints.push(rhs.constants[0][0]/lhs.constants[0][1]);
						}
					}
					data.push({
					  x: xPoints, 
					  y: yPoints, 
					  type: 'scatter',
					  name: 'constraint'+(key+1)
					})
					
				});
				size= vm.tables.length;
				activeRows=[];
				inactiveRows=[];
				activeRows=vm.tables[size-1].active;
				inactiveRows=vm.tables[size-1].inactive;
				x1=0;
				y1=0;
				
				for(i=0;i<activeRows.length;i++){
					a= activeRows[i].split("=");
					if(x==a[0]){
						x1=parseFloat(a[a.length-1]);
					}
					if(y==a[0]){
						y1=parseFloat(a[a.length-1]);
					}
				}
				if(inactiveRows!=null){
					for(i=0;i<inactiveRows.length;i++){
						a= inactiveRows[i].split("=");
						if(x==a[0]){
							x1=parseFloat(a[a.length-1]);
						}
						if(y==a[0]){
							y1=parseFloat(a[a.length-1]);
						}
					}
				}
				
				data.push({
					x: [x1], 
					y: [y1], 
					type: 'scatter',
					name: 'Optimal Solution',
				})
				Plotly.newPlot('graphDiv', data);
			}else{
				document.getElementById('graphDiv').innerHTML += "<br><h3>Sorry, graph is available only for two variables. :( </h3>";
			}
		}
		
		/* Production of the other inputs in ETS */
		function next(){
			s= vm.mSource;
			d= vm.nDestinations;
			vm.sources= new Array(s);
			vm.destinations= new Array(d);
			vm.costs= new Array(s);
			vm.labelcols=new Array(d);
			vm.labelrows= new Array(s);
			for(i=0;i<s;i++){
				vm.labelrows[i]=i+1;
			}
			for(i=0;i<d;i++){
				vm.labelcols[i]=i+1;
			}
			for(i=0;i<s;i++){
				vm.costs[i]=new Array(d);
			}
		}
		
		/* For Solving the ETS */ 
		function solveETS(){
			vm.objFunction="z=";
			vm.constraints=[];
			first=true;
			for(i=0;i<vm.mSource;i++){
				for(j=0;j<vm.nDestinations;j++){
					if(vm.costs[i][j]==null|| vm.costs[i][j]==undefined){
						vm.costs[i][j]=0;
					}
					
					if(vm.costs[i][j]!=0){
						if(first){
								vm.objFunction+= vm.costs[i][j]+"x"+(i+1)+(j+1);
								first=false;
						}
						else
							vm.objFunction+= "+"+vm.costs[i][j]+"x"+(i+1)+(j+1);
					}	
				}
			}
			//per rows for the source constraint
			for(i=0;i<vm.mSource;i++){
				row=[];
				row=vm.costs[i];
				lhs="";
				first=true;
				for(j=0;j<vm.nDestinations;j++){
						if(first){
							lhs+="x"+(i+1)+(j+1);
							first=false;
						}
						else lhs+="+ x"+(i+1)+(j+1);
					
				}
				if(vm.sources[i]==null|| vm.sources[i]==undefined){
					vm.sources[i]=0;
				}
				vm.constraints.push({
					lhs:lhs,
					inequality:"<=",
					rhs: vm.sources[i]+""
				})
			}
				
			//per colum for the dest constraint
			for(i=0;i<vm.nDestinations;i++){
				col=[];
				col=getCol(vm.costs,i);
				lhs="";
				first=true;
				for(j=0;j<vm.mSource;j++){
						if(first){
							lhs+="x"+(j+1)+(i+1);
							first=false;
						}
						else lhs+="+ x"+(j+1)+(i+1);					
				}
				if(vm.destinations[i]==null|| vm.destinations[i]==undefined){
					vm.destinations[i]=0;
				}
				vm.constraints.push({
					lhs:lhs,
					inequality:"=",
					rhs: vm.destinations[i]+""
				})
			}
			solve();
		}

		/* Array Manipulations */
		function removeA(arr) {
		    var what, a = arguments, L = a.length, ax;
		    while (L > 1 && arr.length) {
		        what = a[--L];
		        while ((ax= arr.indexOf(what)) !== -1) {
		            arr.splice(ax, 1);
		        }
		    }
		    return arr;
		    //reference: https://stackoverflow.com/questions/3954438/how-to-remove-item-from-array-by-value
		}

		function getCol(matrix, col){
	       var column = [];
	       for(var i=0; i<matrix.length; i++){
	          column.push(matrix[i][col]);
	       }
	       return column;
	       //reference: https://stackoverflow.com/questions/7848004/get-column-from-a-two-dimensional-array-in-javascript
	    }
		
		function transpose(a) {
			return Object.keys(a[0]).map(function(c) {
				return a.map(function(r) { return r[c]; });
			});
			//reference:https://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript
		}
		
		function difference(a1, a2) {
		  var result = [];
		  for (var i = 0; i < a1.length; i++) {
			if (a2.indexOf(a1[i]) === -1) {
			  result.push(a1[i]);
			}
		  }
		  return result;
		}

		/* PARSING */
		function replaceAll(str, find, replace) {
	   		return str.replace(new RegExp(find, 'g'), replace);
		}

		function getRhsLhsEquation(equation){
			res= [];
			temp=replaceAll(equation,"×","");
			temp=replaceAll(temp,"\\,","");
			temp=replaceAll(temp,"\\−","-");
			temp=replaceAll(temp,"\\*","");
			temp=replaceAll(temp," ","");		
			temp1=temp.split("=");
			if(temp1.length!=2){
				reportError();
				return;
			}else{
				temp2= temp1[0].split("");
				temp3= temp1[1].split("");
				LHS= parseEquations(temp2); 
				RHS= parseEquations(temp3);
				vm.varSize=RHS.variables.length;
				if(LHS.variables[0].length==0 && LHS.constants[0].length==0){
					reportError();
					return;
				}if(RHS.variables[0].length==0 && RHS.constants[0].length==0){
					reportError();
					return;
				}else{
					if(vm.isMaximize=="false")
						LHS.variables[0][0]="-"+LHS.variables[0][0];
					res.push(LHS); 
					res.push(RHS);
					return res;	
				}
			}			
		}

		function getEquation(equation){
			res= [];
			temp=replaceAll(equation,"×","");
			temp=replaceAll(temp,"\\,","");
			temp=replaceAll(temp,"\\−","-");
			temp=replaceAll(temp,"\\*","");
			temp=replaceAll(temp," ","");		
			temp1= temp.split("");
			HS= parseEquations(temp1);
			if(HS.variables[0].length==0 && HS.constants[0].length==0){
				reportError();
				return res;
			}else{ 
				return HS;	
			}			
		}

		function parseEquations(temp1){
			result= {
				variables: [],
				constants: []
			};

			variables=[];
			constantss=[];
			tempvar="";
			tempconst="";
			variable=false;
			angular.forEach(temp1, function(c,key){
				if(/[+-]/.test(c)){
					if(variable){
						if(tempvar.length)
							variables.push(tempvar);
					}else{
						tempvar="";
						if(tempconst.length!=0){
							variables.push("");
							tc=parseFloat(tempconst);
							constantss.push(tc);
						}
					}
					variable=false;
					tempconst="";
				}
				if(/[A-Za-z]/.test(c)){
					variable=true;
					tempvar="";
					if(tempconst.length){
						if(tempconst[0]=="-" && tempconst.length==1){
							constantss.push(-1);
						}
						else{
							tc= parseFloat(tempconst);
							constantss.push(tc);	
						}
					}
					else constantss.push(1);
				}
				if(!variable){
					if(/[-]/.test(c))
						tempconst+=c
					if(/[.0-9]/.test(c))
						tempconst+=c
					if(key==temp1.length-1){
						tc=parseFloat(tempconst);
						constantss.push(tc);
						variables.push("");
					}
				}
				if(variable){
					if(/[a-zA-Z0-9]/.test(c))
						tempvar+=c;
					if(key==temp1.length-1){
						variables.push(tempvar);
					}
				}
				if(/[^a-zA-Z0-9.+-]/.test(c)){
					reportError();
					result= {
						variables: [],
						constants: []
					};

					variables=[];
					constantss=[];
					tempvar="";
					tempconst="";
					variable=false;
				}
			});
			//merge the constantss with same variable
			for(i=0;i<variables.length-1;i++){
				for(j=i+1;j<variables.length;j++){
					if(variables[i]==variables[j] && constantss[i]!=0){
						constantss[i]+=constantss[j];
						constantss[j]=0;
						variables[j]="/null/";
					}	
				}
			}
			variables=removeA(variables,"/null/");
			constantss=removeA(constantss,0);
			result.variables.push(variables);
			result.constants.push(constantss);
			return result;
		}

		/*Error Reporting and Variables Re-initializing*/
		function reportError(){
				$('.ui.basic.modal.error')
				  .modal('show');
			reInit();			
		}
		
		/* When switching to ETS or Optimization*/
		function switchOpt (){
			reInit();
			vm.objFunction="";
			vm.constraints= [];
			vm.isMaximize=true;
			vm.ETS=!(vm.ETS);
		}

		/*variables re-initializing*/
		function reInit(){
			vm.table=[];
			vm.tables=[];
			vm.headers=[];
			vm.initialTable=[];
			vm.rowsize=0;
			vm.colsize=0;
			vm.headersMin=[];
			vm.isDual=false;
			vm.slackSize=0;
			vm.varSize=0;
			vm.showTable=false;
			vm.basicSOlution=[];
			vm.currentPage=0;
			vm.optimalSolution="";
			vm.variables=[];
			vm.destinationType="";
			vm.sourceType="";
			vm.costType="";
			document.getElementById("graphDiv").innerHTML = "";
		}
		
		/* mapping of the constants to the table */
		function maptoTable(table,csize,lhs,rhs,rNum){
			lhsVarSize=lhs.variables[0].length;
			isVariable=false;
			for(i=0;i<lhsVarSize;i++){
				isVariable=false;
				for(j=0;j<csize;j++){
					if(table[0][j]===lhs.variables[0][i]){
						table[rNum][j]=lhs.constants[0][i];
						isVariable=true;
					}
				}
			}
			for(i=0;i<csize;i++){
				if(table[0][i]==="RHS" && rhs.variables[0][0]===""){
					table[rNum][i]=rhs.constants[0][0];
				}
			}
			table1=[];
			angular.copy(table,table1);
			return table;
		}
		
		/*table initializations for noraml maximization/minimization and duality*/
		function tableInitialization(objLHS,objRHS){
			table = [];
			constraintSize= vm.constraints.length;
			RHSVarSize= objRHS.variables[0].length
			LHSVarSize= objLHS.variables[0].length
			rowsize=(constraintSize)+2;
			colsize=(RHSVarSize+LHSVarSize)+(rowsize-1);
			vm.rowsize=rowsize;
			vm.colsize=colsize;
			vm.variables=objRHS.variables[0];
			
			table = new Array(rowsize);//row
			for(i=0;i<rowsize;i++){
				table[i]= new Array(colsize);// objFunction variables+ number of constraints (s1++) + 1 (RHS)
			}
			vm.varSize=RHSVarSize;
			//header of table
			for(i=0;i<RHSVarSize;i++){
				table[0][i]=objRHS.variables[0][i];
			}
			for(i=0;i<constraintSize;i++){
				table[0][i+RHSVarSize]='s'+(i+1);
			}
			for(i=0;i<LHSVarSize;i++){
				table[0][i+RHSVarSize+constraintSize]=objLHS.variables[0][i];
			}
			table[0][colsize-1]="RHS";
			tempconstraints=[]
			angular.copy(vm.constraints,tempconstraints);
			//iteration through constraints
			angular.forEach(tempconstraints, function(value, key){
				//sN= key+1
				//row= key+1
				value.lhs;
				value.rhs;
				value.inequality;
				rhs=getEquation(value.rhs);
				lhs=getEquation(value.lhs);
				
				arr=[];
				arr= difference(lhs.variables[0], table[0]);
				//arr= arr_diff(lhs.variables[0],table[0]);
				size=arr.length;
				size1=table[0].length;
				if(size>0){
					for(i=0;i<size;i++){
						table[0][i+size1]=arr[i];
					}
				}
				//|| value.inequality==="="
				if(value.inequality==="<=" ){
					lhs.variables[0].push("s"+(key+1));
					lhs.constants[0].push(1);
				}if(value.inequality===">="){
					lhs.variables[0].push("s"+(key+1));
					lhs.constants[0].push(-1);
				}
				//map to table
				table=maptoTable(table,colsize,lhs,rhs,(key+1));
			});

			//mapping objective function to table
			 objRHS.variables[0].length
			 objLHS.variables[0].length
			 for(i=0;i<RHSVarSize;i++){
				objLHS.variables[0].push(objRHS.variables[0][i]);
				
				if(vm.isMaximize=="false"){
					objLHS.constants[0].push(objRHS.constants[0][i]);
				}
				else objLHS.constants[0].push(-(objRHS.constants[0][i]));
			 }

			 objRHS.variables[0]=[];
			 objRHS.constants[0]=[];
			 objRHS.variables[0].push("");
			 objRHS.constants[0].push(0);

			 table=maptoTable(table,colsize,objLHS,objRHS,(rowsize-1));
			 
			 for(i=0;i<vm.rowsize;i++){
				 for(j=0;j<vm.colsize;j++){
					 if(table[i][j]==undefined){
						 table[i][j]=0;
					 }
				 }
			 }

			return table;
		}
		
		function tableInitializationMin(){
			table= [];
			temp=vm.objFunction;
			temp= getRhsLhsEquation(temp);
			objLHS = temp[0];
			objRHS = temp[1];
			variableLHS= objLHS.variables[0][0];
			vm.variables=objRHS.variables[0];
			
			constraintSize= vm.constraints.length;
			RHSVarSize= objRHS.variables[0].length
			LHSVarSize= objLHS.variables[0].length
			rowsize=(constraintSize)+2;
			colsize=(RHSVarSize)+1;
			table = new Array(rowsize);//row
			vm.varSize=RHSVarSize;
			for(i=0;i<rowsize;i++){
				table[i]= new Array(colsize);// objFunction variables+ 1 (RHS)
			}
			//header of table
			for(i=0;i<RHSVarSize;i++){
				table[0][i]=objRHS.variables[0][i];
			}
			table[0][colsize-1]="RHS";
			tempconstraints=[]
			angular.copy(vm.constraints,tempconstraints);
						//iteration through constraints
			angular.forEach(tempconstraints, function(value, key){
				//sN= key+1
				//row= key+1
				value.lhs;
				value.rhs;
				value.inequality;
				rhs=getEquation(value.rhs);
				lhs=getEquation(value.lhs);
				

				if(value.inequality==="<="){
					reportError(); //cannot handle <= = error message (add in ui)
					return;
				}else{
					//map to table
					table=maptoTable(table,colsize,lhs,rhs,(key+1));
				}
				
			});			
			//mapping objective function to table
			 objLHS.variables[0]=[];
			 objLHS.constants[0]=[];
			 for(i=0;i<RHSVarSize;i++){
				objLHS.variables[0].push(objRHS.variables[0][i]);
				objLHS.constants[0].push(objRHS.constants[0][i]);
			 }

			 objRHS.variables[0]=[];
			 objRHS.constants[0]=[];
			 objRHS.variables[0].push("");
			 objRHS.constants[0].push(0);

			 table=maptoTable(table,colsize,objLHS,objRHS,(rowsize-1));
			 
			 for(i=0;i<rowsize;i++){
				 for(j=0;j<colsize;j++){
					 if(table[i][j]==undefined){
						 table[i][j]=0;
					 }
				 }
			 }
			 //preparation for the headers
			vm.headersMin= table[0];
			table.splice(0,1);

			table=transpose(table);//transpose
			
			headers= [];
			colsize=table[0].length;
			for(i=0;i<colsize-1;i++){
				headers.push("s"+(i+1));
			}
			vm.slackSize=colsize-1;
			headers= headers.concat(vm.headersMin);
			headers.splice(headers.length-1,0,variableLHS);
			angular.copy(headers,vm.headersMin);
			
			table.splice(0,0,vm.headersMin);
			size=table[table.length-1].length;
			for(i=0;i<size;i++ ){
				if(table[table.length-1][i]!=0)
					table[table.length-1][i]=-table[table.length-1][i];
			}
			for(i=1; i< table.length;i++){
				for(j=colsize-1;j<vm.headersMin.length-1;j++){
					if(j==colsize-1+(i-1))
						table[i].splice(j,0,1);
					else
						table[i].splice(j,0,0);
				}
			}
			vm.rowsize=table.length;
			vm.colsize=table[0].length;
			return table;
		}
		
		/* Checker if the last row has negative value */
		function isNegative(table){
			result=false;

			for(i=0;i<vm.colsize-1;i++){ 
				if(table[vm.rowsize-1][i] < 0){
					result= true;
					break;
				}
			}
			return result;
		}
		
		/* the main function which returns the initial table */
		function insertToTables(table){
			//intermediate solution
			tablecopy=[];
			activeRows=[];
			inactiveRows=[];
			column=[];
			if(vm.isDual && vm.isMaximize=="false"){
				for(i=vm.slackSize;i<vm.colsize-2;i++){
					activeRows.push(table[0][i]+"= "+table[vm.rowsize-1][i]);
				}
				activeRows.push(table[0][vm.colsize-2]+"= "+table[vm.rowsize-1][vm.colsize-1]);
				angular.copy(activeRows,vm.basicSOlution);
				
				for(i=0;i<vm.slackSize;i++){
					column=getCol(table,i);
					count1s=0;
					index=-1;
					inactive=false;
					for(j=1;j<vm.rowsize;j++){
						if((column[j]==1||column[j]==0 || column[j]==undefined) && inactive==false){
							if(column[j]==1){
								count1s=count1s+1;
								index=j;
							}
						}else{
							inactive=true;
							break;
						}
					}
					if(count1s==1 && index!=-1 && inactive==false){
						activeRows.push(column[0]+"= "+table[index][vm.colsize-1]);
					}
				}
				
				angular.copy(table,tablecopy)
				tablecopy.splice(0,1);
	
				vm.tables.push({
					headers: table[0],
					table: tablecopy,
					active: activeRows,
					inactive: null
				});
			}else{
				//check for active and inactive columns excluding the RHS
				for(i=0;i<vm.colsize-1;i++){
					column=getCol(table,i);
					count1s=0;
					index=-1;
					inactive=false;
					for(j=1;j<vm.rowsize;j++){
						if((column[j]==1||column[j]==0 || column[j]==undefined) && inactive==false){
							if(column[j]==1){
								count1s=count1s+1;
								index=j;
							}
						}else{
							inactive=true;
							break;
						}
					}
					if(inactive){						
						inactiveRows.push(column[0]+"= 0");
						if(i<=vm.varSize-1){
							vm.basicSOlution.push(column[0]+"= 0");
						} 
						else if(i==colsize-2){
							vm.basicSOlution.push(column[0]+"= 0");
						}				
					}else{
						if(count1s==1 && index!=-1){
							activeRows.push(column[0]+"= "+table[index][vm.colsize-1]);
							if(i<=vm.varSize-1){
								vm.basicSOlution.push(column[0]+"= "+table[index][vm.colsize-1]);
							}
							else if(i==colsize-2){
								vm.basicSOlution.push(column[0]+"= "+table[index][vm.colsize-1]);
							}
						}
					}
				}
				angular.copy(table,tablecopy)
				tablecopy.splice(0,1);
				vm.tables.push({
					headers: table[0],
					table: tablecopy,
					active: activeRows,
					inactive: inactiveRows
				});
			}
		}

		/* The main function that applies the simplex method*/
		function simplexMethod(initialTable){

			//push initial table to tables + intermediate solution
			insertToTables(initialTable);	
			simplexTable=initialTable;
			PC=-1;
			PE=-1;
			PR=[];
			iterations=1;
			while(isNegative(simplexTable) && iterations<999){
				vm.basicSOlution=[];
				tempTable=[];
				maxNeg=0;
				minTest= Infinity;
				//pivot column largest negative
				for(i=0;i<vm.colsize-1;i++){ //DOUBLE CHECK
					if(simplexTable[vm.rowsize-1][i]<0){
						if(maxNeg<(simplexTable[vm.rowsize-1][i]*-1)){
							maxNeg= (simplexTable[vm.rowsize-1][i]*-1);
							PC=i;
						}
					}
				}
			
				bColumn = getCol(simplexTable,PC);
				aColumn = getCol(simplexTable,vm.colsize-1);
				for(i=1;i<vm.colsize-1;i++){
					if(bColumn[i]!=0 && bColumn[i] > 0){
						ratio= (aColumn[i]/bColumn[i]);
						if(ratio<minTest){
							minTest=ratio;
							PE=i;
						}
					}
				}
	
				try {
					simplexTable[PE][PC];
				}
				catch(err) {
					reportError();
					return;
				}
				peC=simplexTable[PE][PC];
				if(peC!=1){
					for(i=0;i<vm.colsize;i++){
						simplexTable[PE][i]=(simplexTable[PE][i])/peC;
					}
				}
				
				//get row of the pivot element
				PR= simplexTable[PE];
				
				//gauss-jordan
				for(i=1;i<vm.rowsize;i++){
					//PC element * PR

					temp=[];
					PCelement=simplexTable[i][PC];
					if(i!=PE){
						for(j=0;j<vm.colsize;j++){			
							temp.push(PCelement*PR[j]);						
						}
						
						for(j=0;j<vm.colsize;j++){
							simplexTable[i][j]=(simplexTable[i][j]-temp[j]);
						}
					}					
				}
				
				insertToTables(simplexTable);
				iterations++;

			}
		}

		/*Primary Solver of the Linear Programming*/
		function solve (){
			if(!vm.isETS)
				reInit();
			if(checkConstraints()&&(vm.objFunction.length)){
				temp= vm.objFunction;

				//Objective Function Parsing
				temp1= getRhsLhsEquation(temp);
				objLHS = temp1[0];
				objRHS = temp1[1];

				//table initialization
				if(vm.isMaximize=="false"){
					if(vm.isDual){
						vm.isMaximize=true;
						objLHS.variables[0][0]=replaceAll(objLHS.variables[0][0],"\\-","");
						vm.initialTable=tableInitializationMin();
						vm.isMaximize="false";
						showTables();
						
						
					}else{
						vm.initialTable=tableInitialization(objLHS,objRHS);
						showTables();
					}
				}else{
					vm.initialTable=tableInitialization(objLHS,objRHS);
					showTables();
				}
				
			}else{
				reportError();
			}
		}
		
		/* Last step after solving */
		function showTables(){
			vm.headers=vm.initialTable[0];	
			simplexMethod(vm.initialTable);
			vm.basicSOlution= vm.basicSOlution.join(", ");
			vm.optimalSolution=vm.basicSOlution;
			plotGraph();
			vm.showTable=true;
		}
			 
		/*Error handler + duality checker*/
		function checkConstraints(){
			//check if all of the inequalities of constraints are >= and minimization
			valid=true;
			ge= true;
			
			if(!(vm.constraints.length)){
				valid=false;
			}
			if(valid){
				angular.forEach(vm.constraints, function(value, key){
					if(!(value.lhs.length)){
						valid=false;
					}
					if(!(value.rhs.length)){
						valid=false;
					}
					if(!(value.inequality.length)){
						valid=false;
					}
					if(value.inequality!==">="){
						ge=false;
					}
				});
			}
			vm.isDual=ge;
			return valid;
		}
		
		/* For tableu viewing */
		function nextPage() {
			if (vm.currentPage < vm.tables.length - 1) {
				vm.currentPage++;
			}
		};
		
		function prevPage() {
			if (vm.currentPage > 0) {
				vm.currentPage--;
			}
		};
		
		/* adding and removing constraints */
		function addConstraint(){
			vm.constraints.push({
				lhs:'',
				inequality:'',
				rhs: ''
			});
		}
		
		function removeConstraint(constraint){
			var index = vm.constraints.indexOf(constraint);
			vm.constraints.splice(index, 1);  
		}
	}

})();
