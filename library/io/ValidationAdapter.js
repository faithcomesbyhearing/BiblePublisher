/**
* This class is the database adapter for the validation table
*/
class _ValidationAdapter {
	constructor() {
		this.bibleId = null;
		this.dbDir = null;
		this.program = null;
		this.datetime = new Date().toISOString();
		this.database = null;
		Object.seal(this);
	}
	open(bibleId, dbDir, program) {
		this.bibleId = bibleId;
		this.dbDir = dbDir;
		this.program = program;
		const databaseFile = dbDir + '/' + bibleId + '.db';
    	const sqlite3 = require('sqlite3'); //.verbose();
		this.database = new sqlite3.Database(databaseFile);
		const statement = 'create table if not exists validation(' +
		'program text not null, ' +
		'datetime text not null, ' +
		'book text not null, ' +
		'errors text not null);';
		this.database.exec(statement, function(err) {
			if (err) throw new Error(err);
		});
	}
	error(book, message, callback) {
		var bookCode = book.split('.')[0];
		if (bookCode.length > 3) {
			bookCode = bookCode.substr(-3);
		}
		const sql = "insert into validation(program, datetime, book, errors) values (?,?,?,?)";
		const values = [this.program, this.datetime, book, message];
		this.database.run(sql, values, function(err) {
			if (err) throw new Error(err);
			callback(1);
		});
	}
	close() {
		var that = this;
		const sql = "insert into validation(program, datetime, book, errors) values (?,?,'','DONE')";
		const values = [this.program, this.datetime];
		this.database.run(sql, values, function(err) {
			if (err) throw new Error(err);
			that.database.close();
		});
	}
}
class ValidationAdapter {
	constructor() {
		throw new Error('Use ValidationAdapter.shared()');
	}
	static shared() {
		if (!ValidationAdapter.singleton) {
			ValidationAdapter.singleton = new _ValidationAdapter();
		}
		return ValidationAdapter.singleton;
	}
}
