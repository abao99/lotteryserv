var http =  require('http');
var io = require('socket.io'); // 加入 Socket.IO
var querystring = require('querystring');


//建立伺服器
var server = http.createServer(function(request, response) {
  console.log('Connection listen*8001');
});
server.listen(8001);  //指定port

//連線資料
var mysql = require('mysql');
var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'admin',
  password : '123456',
  database : 'lottery'
});

//連線資料庫
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  }); 

var serv_io = io.listen(server);  // 開啟 Socket.IO 的 listener

serv_io.on('connection',function(socket){
  
    qry(socket);

    socket.on('submit',function(data){
      var result = querystring.parse(data);
      console.log(result.dateStart);
      Submit(result,socket);
    });
    
    socket.on('alz',function(data){
      alz(data,socket);
    });
  
});    

function alz(data,socket){
  
  var request = require('request');
  var url = "http://www.kufa88.com/Promotion/jingcai"; 
  var resule = [];
  var alzcount = [];
  var upalz = []; //紀錄更新資料的id & 新增幾筆資料
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body) // 打印網頁資訊
      body=body.replace(/\r\n|\n|\r/g,"");
      
      resule = catech(body); //resule[第幾筆資料]["race"]
      //console.log(resule[39]["race"]);
      
      //判斷更新或新增
      
      if(resule.length !=0){
        console.log("第一筆資料");
        var sql_insert = "INSERT INTO game (date, race, host, visite, time, concede, victory, victory1, draw, draw1, defeat, defeat1, num)"+ 
                 "VALUES ";
        var count =0;  // 新增幾筆資料
        
        update(resule,0,sql_insert,count,upalz,function(){  //resule 抓到的資料 alz:紀錄更新或新增幾筆資料
          console.log(upalz);
          console.log(upalz.length);
          var row = [];
          var rowresult={};
           
          
          insertresult(upalz,row,function(){
            console.log("insert:"+row);
            
            updateresult(upalz,row,function(){
              console.log("upate:"+row);

              for(i = 0; i <row.length ; i++){
                rowresult[i] = row[i]; 
              };
              console.log("rowresult:"+rowresult);
              socket.emit('alzresult',rowresult);
            })
              
          });

        });
      }
    } 
  }) 
}

function insertresult(upalz,row,callback){
  
  console.log("index"+index);
  var index = upalz.length-1;
  if(upalz[index]["insertNumber"]){
    console.log(upalz[index]["insertNumber"]);
    console.log("inIF");
    var sql = "";
    
        sql = "SELECT "+
                 "* "+ 
              "FROM "+
                 "game "+
              "ORDER BY "+
                 "id "+
                 "DESC "+
              "limit "+
                  upalz[index]["insertNumber"]+";";

    con.query(sql, function (err, result) {
      console.log(sql);
      console.log("inQuery");
        if (err) throw err;
       console.log(result); 
      for(var i = 0; i <result.length ; i++){
        console.log(result[i]["id"]);
        result[i].alz="insert";
        console.log(result[i]["id"]);
        console.log(result[i]["alz"]);
        row.push(result[i]); 
      }
      callback(row);
    }); 
  }
  callback(row);
}

function updateresult(upalz,row,callback){
  var index = upalz.length-1;
  if(upalz[index]["insertNumber"]){
    index--;
  }
  if(upalz[0]["updateId"]){
    console.log("upIF");
    var sql_update= "SELECT "+
                      "* "+ 
                    "FROM "+
                      "game "+
                    "where ";
    
    for(var i=0; i<=index;i++){          //哪幾筆資料有更新
      if(i != index){
        sql_update+=" id = "+upalz[i]["updateId"]+" or";
      }
      else{
        sql_update +=" id = "+upalz[i]["updateId"]+" ";
      }
    }

    sql_update+= " ORDER BY "+
                    " date , time;";

    con.query(sql_update, function (err, result) {
      console.log("upQuery");
      console.log(sql_update);
        if (err) throw err;
        
      for(var i = 0; i <result.length ; i++){
        result[i].alz="update";
        row.push(result[i]); 
      }
      callback(row); 
    });
  }
  callback(row);       
}

function update(resule,n,sql_insert,count,upalz,callback){

      var sql = "select "+      //查詢 判斷資料存不存在
                  "*"+ 
                "from "+
                  "game "+ 
                "where "+ 
                  "date = '"+resule[n]["date"]+"' and "+      
                  "race = '"+resule[n]["race"]+"' and "+
                  "host ='"+resule[n]["host"]+"' and "+
                  "visite ='"+resule[n]["visite"]+"';";
     
      con.query(sql, function (err,row) {  //查詢 判斷資料存不存在
      
        if (row.length == 0){     //資料不存在，新增
          console.log("新增資料");
          count++;
          sql_insert += "('"+resule[n]["date"]+"' ,"//sql 新增資料字串
                         +"'"+resule[n]["race"]+"' , "
                         +"'"+resule[n]["host"]+"' , "
                         +"'"+resule[n]["visite"]+"', "
                         +"'"+resule[n]["time"]+"' , "
                         +"'"+resule[n]["concede"]+"', "
                         +"'"+resule[n]["victory"]+"' ,"
                         +"'"+resule[n]["victory1"]+"' , "
                         +"'"+resule[n]["draw"]+"' , "
                         +"'"+resule[n]["draw1"]+"' , "
                         +"'"+resule[n]["defeat"]+"' , "
                         +"'"+resule[n]["defeat1"]+"' , "
                         +"'"+resule[n]["num"]+"'"
                         +") ,";
          if(n+1 < resule.length){ //還有資料
            update(resule,n+1,sql_insert,count,upalz,function(){
              callback(upalz);
            });    //處理下一筆
          }
          else{
            console.log("else新增資料");
            sql_insert = sql_insert.substring(0,sql_insert.length-1); //刪掉,  
            //console.log(sql_insert);

            con.query(sql_insert, function (error, insertrow) {
              if (error) throw error;
              
            }); //新增資料
              console.log("新增幾筆資料"+count);
              upalz.push({"insertNumber":count});//記錄新增幾筆資料
            callback(upalz,count);   //資料處理完
          }   
        }        
        else{   //資料存在，更新
          
          if(row[0]["num"] != resule[n]["num"]){    //更新競猜人數
           
            var sql_update ="UPDATE "+ 
                              "game "+ 
                            "SET "+ 
                              "num='"+resule[n]['num']+" ' "+ 
                            "WHERE "+ 
                            "id='"+row[0]['id']+" ' "; 
               
            upalz.push({"updateId":row[0]['id']});//紀錄更新資料的id
            
            con.query(sql_update, function (error, updaterow) {   //更新資料
             
              if (error) throw error;
            });  
          }    
         
          if(n+1 < resule.length){ //還有資料
            update(resule,n+1,sql_insert,count,upalz,function(){
              
              callback(upalz);
            }); //處理下一筆
          }
          else{
             
            callback(upalz);   //資料處理完
          }  
        }  
      });
  //return alz; //回傳更新資料的id & 新增幾筆資料
}

function catech(body){
  var regex = /<tbody>(.*)<\/tbody>/;
  var tbody = regex.exec(body);
  
  var resuldate = [];
  var date = [];
  var data = [];
  var resule = [];
  regex = /<td colspan="6"><span class="moreIcon"><\/span>(.*?) 每次竞猜选择一个选项下注/g;
 // console.log(regex);
  while(date = regex.exec(tbody[1])){
    
    resuldate.push(date[1]);//date 日期
  } 
  //console.log(resuldate[1]);
  
  //抓一天賽事
  
  var tr = [];
  var moreindex ;
  
  for(var i=0; i<resuldate.length ; i++) {
    
    moreindex = i+1;
    regex = new RegExp('<tr class="moreContent more'+moreindex+'" style="display: table-row">(.*?)<\/tr>','g');

    //console.log(regex);
    var resulday = [];
    while(tr = regex.exec(tbody[1]) ){

      resulday.push(tr[1]);
      //console.log(tr[1]);
    } 
    for(var j = 0; j < resulday.length; j++){
      
      //抓主隊
      var host = [];
      regex = /<span class="ht">(.*)<\/span>vs/g;
      //console.log(regex);
      host = regex.exec(resulday[j]);
     // console.log(host[1]);
      
      //抓客隊
      var visite = [];
      regex = /<span class="at">(.*?)<\/span>/g;
      //console.log(regex);
      visite = regex.exec(resulday[j]);
      //console.log(visite[1]);
      
      //抓時間
      var time = [];
      regex = /<td class="time">(.*?)<\/td>/g;
      //console.log(regex);
      time = regex.exec(resulday[j]);
      //resultime.push(time[1]);
     // console.log(time[1]);
      
      //抓讓球
      var concede = [];
      regex = /<span class="rq2".*?>(.*?)<\/span>/g;
      //console.log(regex);
      concede = regex.exec(resulday[j]);
      //resulconcede.push(concede[1]);
      //console.log(concede[1]);
      
      //抓人數
      var num = [];
      regex = /<td class="num">(.*?)人竞猜<\/td>/g;
      //console.log(regex);
      num = regex.exec(resulday[j]);
      //resulnum.push(num[1]);
     // console.log(num[1]);
      
      //抓勝
      var resulvictory = [];
      var victory = [];
      regex = /<span>胜(.*?)<input/g;
      //console.log(regex);
      while(victory = regex.exec(resulday[j])){
        
        resulvictory.push(victory[1]);//victory[1] victory[2]
      } 
     // console.log(resulvictory[0]);
     // console.log(resulvictory[1]);
      
      //抓平
      var resuldraw = [];
      var draw = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(draw = regex.exec(resulday[j])){
        
        resuldraw.push(draw[1]);//draw[1] draw[2]
      } 
     // console.log(resuldraw[0]);
     // console.log(resuldraw[1]);
      
      //抓負
      var resuldefeat = [];
      var defeat = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(defeat = regex.exec(resulday[j])){
        
        resuldefeat.push(defeat[1]);//defeat[1] defeat[2]
      } 
     // console.log(resuldefeat[0]);
     // console.log(resuldefeat[0]);
      
      //賽事
      var race = [];
      regex = /class="leagueName".*?>(.*?)<\/span><\/td>/g; 
      race = regex.exec(resulday[j]);
     // console.log(race[1]);
    
      data.push({
        "date":resuldate[i],
        "race":race[1],
        "host":host[1],
        "visite":visite[1],
        "time":time[1],
        "concede":concede[1],
        "num":num[1],
        "victory":resulvictory[0],
        "victory1":resulvictory[1],
        "draw":resuldraw[0],
        "draw1":resuldraw[1],
        "defeat":resuldefeat[0],
        "defeat1":resuldefeat[1] 
      });
    }
    
  } 
  return data;
}
 
function Submit(search,socket){
  console.log(search.dateStart);
  var sql = "";
  var row = {};
      sql = "SELECT "+
               "* "+ 
            "FROM "+
               "game "+
            "where ";

            if(search.dateStart != "" && search.dateEnd == ""){
              sql+=" date = '"+search.dateStart+"' and";
            } 
            else if(search.dateStart== "" && search.dateEnd != ""){
              sql+=" date = '"+search.dateEnd+"' and";
            }
            else if(search.dateStart != "" && search.dateEnd != ""){
              sql+=" date >= '"+search.dateStart+"' and"+
                    "  date <= '"+search.dateEnd+"' and";
            }
            if(search.race !=""){
              sql+=" race = '"+search.race+"' and";
            }
            if(search.host !=""){
              sql+=" host = '"+search.host+"' and";
            }
            if(search.visite != ""){
              sql+=" visite = '"+search.visite+"' and";
            }
       sql = sql.substring(0,sql.length-3);
       sql+= " ORDER BY "+
               "date , time;";
          
  con.query(sql, function (err, result) {
      if (err) throw err;
      
    for(i = 0; i <result.length ; i++){
      row[i] = result[i]; 
    };

    console.log(row[0]["id"]);
    socket.emit('search',row);
  });          
}
 
function qry(socket){
  //計算今天日期
  var today ="";
  var d = new Date();
  var day = d.getMonth()+1;
  today = d.getFullYear()+"-"+"0"+day+"-"+d.getDate();
    
  //搜尋資料
  var sql = "";
  var row = {};
      sql = "SELECT "+
               "* "+ 
            "FROM "+
               "game "+
            "where "+
               "date >='"+today+"'"+
            " ORDER BY "+
               "date , time;";
                
  con.query(sql, function (err, result) {
      if (err) throw err;
      
    for(i = 0; i <result.length ; i++){
      row[i] = result[i]; 
    } 

    socket.emit('qry',row);
  });        
} 
