# Publisher

The Publisher program prepares Bible Text for publication in the BibleApp.  It expects the Bible text to be in USX form, and translates it into publication ready text stored in a Sqlite database.  The Publisher program prepares the following content into the following Sqlite tables:

1. tableContent: contains data needed to present a Table of Contents, page headings and abbreviations.
    i.e. bookCode, heading, title, name, abbrev, lastChapter, priorBook, nextBook, chapterRowId
2. chapters: contains the Bible text in HTML form, and a reference as a primary key.  An example reference is JHN:3
3. concordance: contains one row for each word in the Bible, and an index to all references for that word.
4. verses: contains one row of text for each verse in the Bible including the text.  This is used to present search results.  An example references is ROM:9:2-3
5. styleUse: contain a list of USFM/USX styles that occurred in the translation and the references.  This is used to ensure the App supports all of the needed styles.
6. styleIndex: contains a summary list of the USFM/USX styles that occurred in the translation.
7. charset: contains one row for each character that occurs.  It is used during validation.
8. identity: will contain identity and version information after the file is validated

## Compatibility

This program has been tested with USX 2.0 and USX 2.5.  Development of a USX 3.0 version is in development.
   
## Running Publisher

Publisher expects a parameters on the command line.  There is no configuration file

	node Publisher.js inputDir outputDir bibleId iso3 iso1 direction

	inputDir - This directory must contain all of the .usx files to process.
	outputDir - This directory will receive the output in a file named {bibleId}.db
	bibleId - This should be the primary identifier of the bible language and version.
	iso3 - This should be the 3 character ISO 639-3 language code.
	iso1 - This should be the 2 character ISO 639-1 language code or null when there is no iso1 code.
	direction - This should be the direction of the script, either 'ltr' or 'rtl'.

## Table of Contents Book Sequence

The book sequence information can be picked up in anyone of three ways.
1) If there is a DBL metadata.xml file, the program will use the sequence information in that file.  The metadata.xml file can be in the same directory as the .usx files, or it can be one directory above.  If it is anywhere else, it will be ignored.
2) If there is no metadata.xml file, but .usx filenames contain a sequence numbers, such as 041MAT.usx, 042MRK.usx, then that number will be used to define the sequence.
3) If there is neither a metadata.xml file, and there is no sequence numbers in the filenames, then the 66 book protestant Canon will be used to define the book sequence.

## Installing node

The Publisher program is written is node.  To install node on a Linux machine using the package installer do the following:

	apt-get install node node-sqlite3

## Using Sqlite

The output of this process is a sqlite database.  Any Sqlite database is stored in a single file that normally resides
on the user's computer.  Sqlite can be downloaded at: https://sqlite.org/download.html
The database supports a simplified, but near standard SQL that will seem familiar to anyone who has used a different SQL database.

Some novel differences that one must know.
1. To open a database simply type: sqlite3 filename
2. To see a list of tables, type: .tables
3. To see a description of a table, type: .schema tableName
4. To exit sqlite, type: .exit








       
     
       
 
