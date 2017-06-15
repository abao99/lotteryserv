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
      body=body.replace(/\r\n|\n|\r/g,"");
      
      catech(body);
    } 
  }) 
}

function catech(body){
  var regex = /<tbody>(.*)<\/tbody>/;
  var tbody = regex.exec(body);
  
  var resuldate = [];
  var date = [];
  regex = /<td colspan="6"><span class="moreIcon"><\/span>(.*?) 每次竞猜选择一个选项下注/g;
  while(date = regex.exec(tbody[1])){
    
    resuldate.push(date[1]);//resul 日期
  } 
  console.log(resul[0]);
  
  //抓一天賽事
  var resulday = [];
  var day = [];
  for(var i=0; i<=resul.length ; i++) {
    regex = new RegExp('/<tr class="moreContent more'+i+'" style="display: table-row">(.*?)<\/tr>/',"g");
    regex = /<tr class="moreContent more1" style="display: table-row">(.*?)<\/tr>/g;
    while(day = regex.exec(tbody[1]) ){
      resulday.push(day[1]);
    }
   
    $data[$date[1][$i-1]] = game($day,$i,$date,$link);	//抓資料存資料庫	tbodydata: 原始要分析的html資料 , $d: 第幾天 , $date:日期資料 ,$link:連線資料
  }
      
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
