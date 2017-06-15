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
  user     : 'root',
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
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body) // 打印網頁資訊
    catech(body);
    } 
  }) 
}

function catech(body){
  var fs = require('fs');
  var cheerio = require("cheerio");
  $ = cheerio.load(body);
  var output = [];
  
      //抓日期
      var date = [];
      var resultdate = [];
      $('tbody .expanded td').each(function(i, elem){
          date.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < date.length; i++){
        
        resultdate[i]= date[i][0].substring(0,10);
      }
      //console.log(date[0][0])
      // output[i] = date[i][0].substring(0,10);output[i] 日期
      
      //抓賽事
      var race = [];
      var resultrace =[];
      $('tbody .more1 td .leagueName').each(function(i, elem){
            race.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < race.length; i++){
        resultrace[i]= race[i][0];
      }
      //抓主隊
      var host = [];
      var resulthost =[];
      $('tbody .more1 .name .vs .ht').each(function(i, elem){
            host.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < host.length; i++){
        resulthost[i]= host[i][0];
      }
      //抓客隊
      var visite = [];
      var resultvisite =[];
      $('tbody .more1 .name .vs .at').each(function(i, elem){
            visite.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < visite.length; i++){
        resultvisite[i]= visite[i][0];
      }
      //抓時間
      var time = [];
      var resulttime =[];
      $('tbody .more1 .time').each(function(i, elem){
            time.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < time.length; i++){
        resulttime[i]= time[i][0];
      }
      //抓讓球.盤口
      var concede = [];
      var resultconcede =[];
      $('tbody .more1 td .rq2').each(function(i, elem){
            concede.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < concede.length; i++){
        resultconcede[i]= concede[i][0];
      }
      //抓人數
      var num = [];
      var resultnum = [];
      $('tbody .more1 .num').each(function(i, elem){
            num.push($(this).text().split('\n'));
        });
      for(var i =0 ; i < num.length; i++){
        resultnum[i]= num[i][0].substring(0,num.length-3);
      }
      //抓勝.平.負
      var result=[];
      $('tbody .more1 .odds span').each(function(i, elem){
            result.push($(this).text().split('\n'));
            console.log(result);    
        });
      
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
