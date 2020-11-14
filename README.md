# Publisher

The Publisher program prepares Bible Text for publication in the BibleApp.  It expects the Bible text to be in USX form, and translates it into publication ready text stored in a Sqlite database.  The Publisher program prepares the following content into the following Sqlite tables:

1. tableContent: contains data needed to present a Table of Contents, page headings and abbreviations.
    i.e. code, heading, title, name, abbrev, lastChapter.
2. chapters: contains the Bible text in HTML form, and a reference as a primary key.
3. concordance: contains one row for each word in the Bible, and an index to all references for that word.
4. verses: contains one row of text for each verse in the Bible including the text.  This is used to present search results.
5. styleUse: contain a list of USFM/USX styles that occurred in the translation and the references.  This is used to ensure the App supports all of the needed styles.
6. styleIndex: contains a summary list of the USFM/USX styles that occurred in the translation.
7. charset: contains one row for each character that occurs.  It is used during validation.
8. identity: will contain identity and version information after the file is validated
   
## Running Publisher

Publisher expects a parameters on the command line.  There is no configuration file

	node Publisher.js inputDir outputDir bibleId iso3 iso1 direction

	inputDir - This directory must contain all of the .usx files to process.
	outputDir - This directory will receive the output in a file named {bibleId}.db
	bibleId - This should be the primary identifier of the bible language and version.
	iso3 - This should be the 3 character ISO 639-3 language code.
	iso1 - This should be the 2 character ISO 639-1 language code or null when there is no iso1 code.
	direction - This should be the direction of the script, either 'ltr' or 'rtl'. 

## Using Sqlite

The output of this process is a sqlite database.  It can be downloaded at: https://sqlite.org/download.html
The database supports a simplified, but near standard SQL that will seem familiar to anyone who has used a different SQL database.

Some novel differences that one must know.
1. To open a database simply type: sqlite3 filename
2. To see a list of tables, type: .tables
3. To see a description of one table, type: .schema tableName
4. To exit sqlite, type: .exit

## TBD

At this writing the Publisher program expects a specific directory structure so that many versions can be processed quickly in an organized manner.

The source USX files are expected in the following location:

    $HOME/ShortSands/DBL/2current/<VersionId>/USX_1/<chapter_files>.usx

To execute the Publisher program you must have both the Publisher directory and the Library directory on your desktop.  The unix/mac command line script is as follows:

    ./Publisher.sh VersionId

The program will create a Sqlite database at the following location with all of the above tables as described.  The directory shown must already exist.

    $HOME/ShortSands/DBL/3prepared/








       
     
       
 
