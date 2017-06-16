var data = []; // 抓到的資料

function doData(n,callback) {  //n 一筆資料
  var sql = '.....';    //查詢 判斷資料存不存在
  .query(,function() {    //查詢 判斷資料存不存在
  	//ins
  	if() {  //不存在 insert
      ....   //sql 新增資料字串
      if(n+1 < data.length) //還有資料
      	doData(n+1);    //處理下一筆
      else
      	callback();   //資料處理完

  	} else {  //update
      .....  //更新資料字串
      .query(,function() {  //更新資料
	      if(n+1 < data.length)
	      	doData(n+1);
	      else
	      	callback();
      })
  	}
  })
}

if() {   //有抓到資料
	doData(0,function(){   //處理第一筆資料 
    
	})
}



a(function(){
	a(function(){
		a(function(){
			a(function(){
				a(function(){

				});
			});
		});
	});
});

function a(callback){
	callback();
}