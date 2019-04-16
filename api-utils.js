/*
	System modules
*/
const fs = require("fs");

Number.prototype.padLeft = function(base,chr){
	let len = (String(base || 10).length - String(this).length)+1;
	return len > 0? new Array(len).join(chr || "0")+this : this;
}
/*
	Modules to export
*/
module.exports = {
	f_exc_log	: "exc",
	f_ora_log	: "ora",
	f_log_pth : "/var/www/cat-felix/log/",

	_trace: function (f,m,o) {
		let d=new Date(), 
				ymd=[d.getFullYear(),(d.getMonth()+1).padLeft(),d.getDate().padLeft()].join(""),
				dfm=[d.getFullYear(),(d.getMonth()+1).padLeft(),d.getDate().padLeft()].join(".")+" "+
						[d.getHours().padLeft(),d.getMinutes().padLeft(),d.getSeconds().padLeft(),d.getMilliseconds()].join(":")+" "+m+"\n",
				lfl=this.f_log_pth+ymd+"_felix_"+f+".log";
		try {
			let 
				utl = require("util"), 
				s = (o)?utl.inspect(o)+"\n":"";
			fs.appendFileSync(lfl, dfm + s, "utf8");
		} catch (e) { console.log(e.message);	};
	},

}