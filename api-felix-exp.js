//	System's modules
const express = require("express");
const oradb		= require("oracledb");
//	App's modules
const utils = require("./api-utils.js");
const query = require("./api-query.js");
//	JSON response
const pattern = {
	code: 0,	/* Error code, 0 - success 			*/
	text: "",	/* Error text, empty on success */
	time: 0, 	/* Execution time 							*/
	data: {}	/* Fill data in if success 			*/
};

function sendResult(res, data) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Content-Type", "application/json");
	res.setHeader("Cache-Control","no-cache");
	res.end(JSON.stringify(data));
}

function runAPI() {
	oradb.createPool({
		user: "scott", password: "tiger", connectString:"oracle12c", 
		queueTimeout: 3000, poolTimeout: 1, queueRequests: true,
		poolMin: 4, poolMax: 16, _enableStats: true
	}, (ep, dbpool) => {

		var app = express();

		app
		.get("/api/departments/", (req, res) => {
			dbpool.getConnection(async(err, dbconn)=>{
				let sql = "select * from t_departments";
				let data = await query.ora_exec_query(dbconn, sql, Object.assign({}, pattern));

				dbconn.close((e)=>{
					sendResult(res, data);
				});
			});
		}) // app.get departments
		.get("/api/departments/goods/:id?", (req, res) => {
			dbpool.getConnection(async(err, dbconn)=>{
				let dep_id = parseInt(req.params.id, 10);
				let sql = "select * from t_goods";

				if (dep_id)
					sql += " where dep_id = " + dep_id;

				let data = await query.ora_exec_query(dbconn, sql, Object.assign({}, pattern));

				dbconn.close((e)=>{
					sendResult(res, data);
				});
			});
		}) // app.get goods
		.get("/api/:query", (req, res) => {
			dbpool.getConnection(async(err, dbconn)=>{

				let cfg = JSON.parse(req.params.query);
				let _keys = Object.keys(cfg); // ["departments", "goods"]
				let out	= {}, promises = [];

				for (let i = 0; i < _keys.length; i++) {
					for (let j = 0; j < cfg[_keys[i]].length; j++) {

						if (out[_keys[i]] == null || !Array.isArray(out[_keys[i]]) || out[_keys[i]].length == 0)
							out[_keys[i]] = [];

						out[_keys[i]].push(Object.assign({}, pattern));
						switch (_keys[i]) {
							case "departments":
								promises.push(query.ora_get_departments(dbconn, cfg[_keys[i]][j], out[_keys[i]][j]));
							break;
							case "goods":
								promises.push(query.ora_get_goods(dbconn, cfg[_keys[i]][j], out[_keys[i]][j]));
							break;
							default:
								utils._trace(utils.f_exc_log, "Query is not found: "+_keys[i], cfg);
							break;
						}
					}
				}
				await Promise.all(promises);
				dbconn.close((e)=>{
					sendResult(res, out);
				});
			});
		}) // app.get complex query
		.listen(3001, () => {
  		console.log("Server is started...");
		})
		.on("clientError", (e, socket) => {
			utils._trace(utils.f_exc_log, "Server client error: ", e);
				socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
		});
	})
};

/*************************************************************************
	Errors in process
*************************************************************************/
process
.on("SIGINT", () => {
	console.log("Server is finished");
	process.exit(0);
})
.on("unhandledRejection", (r, p) => {
  utils._trace(utils.f_exc_log, "Unhandled Rejection at:", p);
	process.exit(0);
})
.on("uncaughtException", (e) => {
	utils._trace(utils.f_exc_log, "Uncaught Exception at:"+e.message+"\n"+e.stack, null);
	process.exit(0);
});
/*************************************************************************
	Run server
*************************************************************************/
runAPI();
