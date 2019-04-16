const utils = require("./api-utils.js");

ora_cfg_sql = function (cfg) {
	let cfg_sql = {}; 

	cfg_sql["departments"] = (cfg.depid) ? " and dep_id in (" + cfg.depid.join(",")+")" : "";
	cfg_sql["goods"] = (cfg.depid) ? " and dep_id in (" + cfg.depid.join(",")+")" : "";
	cfg_sql["goods"] += (cfg.goodid) ? " and good_id in (" + cfg.goodid.join(",")+")" : "";

	let rows = (cfg.rows)?cfg.rows:0;
	let page = (cfg.page)?cfg.page:0;

	cfg_sql["page"] = (rows && page)?" offset " + ((page - 1) * rows) + " rows fetch next " + rows + " rows only":"";

	return cfg_sql;
}

module.exports = {
	ora_exec_query : function (dbc, sql, out) {
		return new Promise(async(resolve, reject)=>{
			let _tm = new Date().getTime();
			dbc.execute(sql, (e, r)=>{
	  		if (e && e.errorNum) {
					out.code = 1;
					out.text = e.message;
					utils._trace(utils.f_ora_log, arguments.callee.name+": "+e.message+"\nSQL: "+sql, _out);
					reject(null);
				} else {
					out.time = new Date().getTime() - _tm;
					out.data = (r && r.rows) ? r.rows : {};
					resolve(out);
				}
			});
		})
	},
	ora_get_departments: function (dbc, cfg, out) {
		return new Promise(async(resolve, reject)=>{
			let sql_cfg = ora_cfg_sql(cfg);
			let sql_txt = "\
				with vrw as ( \
					select * from t_departments \
					where 1 = 1 " + sql_cfg.departments + " \
				) \
		    select v.*, vc.all_amount \
	  	  from vrw v, (select count(*) as all_amount from vrw) vc" +
					sql_cfg.page;
			await this.ora_exec_query(dbc, sql_txt, out);
			resolve();
		});
	},
	ora_get_goods: function (dbc, cfg, out) {
		return new Promise(async(resolve, reject)=>{
			let sql_cfg = ora_cfg_sql(cfg);
			let sql_txt = "\
				with vrw as ( \
					select * from t_goods \
					where 1 = 1 " + sql_cfg.goods + " \
				) \
		    select v.*, vc.all_amount \
	  	  from vrw v, (select count(*) as all_amount from vrw) vc" +
					sql_cfg.page;
			await this.ora_exec_query(dbc, sql_txt, out);
			resolve();
		});
	},

};


