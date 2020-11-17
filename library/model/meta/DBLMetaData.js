/**
* This class parses a DBL MetaData.xml file contents
* and it parses the file.
*/

function DBLMetaData() {
	this.versionName = null;
	this.versionNameLocal = null;
	this.versionAbbrev = null;
	this.iso3 = null;
	this.scriptName = null;
	this.scriptDirection = null;
	this.bookSequence = []
	//Object.seal(this);
}

DBLMetaData.prototype.parse = function(directory) {
	var metaReader = new FileReader(directory);
	var that = this;
	metaReader.fileExists("metadata.xml", function(exists) {
		if (exists != null) {
			that.useFilenameSeq();
		} else {
			metaReader.readTextFile("metadata.xml", function(data) {
				that.parseXML(data);
				console.log("success");
				console.log(that);		
			});
		}
	});
};

DBLMetaData.prototype.parseXML = function(data) {
	var reader = new XMLTokenizer(data);
	var stack = [];
	var attrName = null;
	while (tokenType !== XMLNodeType.END) {
		console.log(stack);
		var tokenType = reader.nextToken();
		var tokenValue = reader.tokenValue();
		console.log('type=|' + tokenType + '|  value=|' + tokenValue + '|');

		switch(tokenType) {
			case XMLNodeType.ELE:
				console.log("push", tokenValue);
				stack.push(tokenValue);
				break;
			case XMLNodeType.ELE_OPEN:
				stack.push(tokenValue);
				break;
			case XMLNodeType.ATTR_NAME:
				//tempNode[tokenValue] = '';
				attrName = tokenValue;
				break;
			case XMLNodeType.ATTR_VALUE:
				if (stack.length == 5) {
					if (stack[1] == "contents") {
						if (stack[2] == "bookList") {
							if (stack[3] == "books") {
								if (stack[4] == "book") {
									if (attrName == "code") {
										this.bookSequence.push(tokenValue);
									}
								}
							}
						}
					}
				}
				break;
			case XMLNodeType.TEXT:
				console.log("TEXT", tokenValue);
				if (stack.length == 3) {
					if (stack[1] == "identification") {
						if (stack[2] == "name") {
							this.versionName = tokenValue;
						}
						else if (stack[2] == "nameLocal") {
							this.versionNameLocal = tokenValue;
						}
						else if (stack[2] == "abbreviation") {
							this.versionAbbrev = tokenValue;
						}
					}
					else if (stack[1] == "language") {
						if (stack[2] == "iso") {
							this.iso3 = tokenValue;
						}
						else if (stack[2] == "script") {
							this.scriptName = tokenValue;
						}
						else if (stack[2] == "scriptDirection") {
							this.scriptDirection = tokenValue;
						}
					}
				}
				break;
			case XMLNodeType.ELE_EMPTY:
				stack.pop();
				break;
			case XMLNodeType.ELE_CLOSE:
				stack.pop();
				break;
		}
	}
};

	//if (reader.fileExists)
	// check if file exists metada
	// call parser
	// if not exist, check if files have SEQ numbers
	// if so read files
	// if not present use default sequenct to find the list of books, use Cano


DBLMetaData.prototype.useFilenameSeq = function() {
	console.log("no file to read, use sequence indicators");

};

DBLMetaData.prototype.useCanonSeq = function() {

};



/*

<?xml version="1.0" encoding="UTF-8"?>
<DBLMetadata id="f27d24fa55e7c364" revision="4" type="text" typeVersion="1.5">
  <identification>
    <name>New Millenium Version</name>
    <nameLocal>ترجمۀ هزارۀ نو</nameLocal>
    <abbreviation>NMV</abbreviation>
    <abbreviationLocal>NMV</abbreviationLocal>
    <scope>Bible</scope>
    <description>Iranian Persian: ترجمۀ هزارۀ نو Bible</description>
    <dateCompleted>2014-07-15</dateCompleted>
    <systemId type="gbc">5613ecc65117ad7ceae93692</systemId>
    <systemId csetid="4d408af4c55f6cdf2a92c7952e2f119203d08538" fullname="NMV2015 DBL" name="NMV15DBL" type="paratext">f27d24fa55e7c3648da81e75214d2188c4764dd0</systemId>
    <bundleProducer>Paratext/7.6.54.28</bundleProducer>
  </identification>
  <confidential>false</confidential>
  <agencies>
    <rightsHolder abbr="EM" uid="560e67f95117ad71be151ed3" url="http://www.elam.com/">Elam Ministries</rightsHolder>
    <contributor qa="true" uid="545d2cb00be06579ca809b57">Wycliffe Bible Translators, Inc.</contributor>
    <contributor content="true" management="true" publication="true" uid="560e67f95117ad71be151ed3">Elam Ministries</contributor>
  </agencies>
  <language>
    <iso>pes</iso>
    <name>Iranian Persian</name>
    <nameLocal>فارسی</nameLocal>
    <ldml>pes</ldml>
    <rod />
    <script>Arabic</script>
    <scriptDirection>RTL</scriptDirection>
    <numerals>Farsi</numerals>
  </language>
  <country>
    <iso>IR</iso>
    <name>Iran</name>
  </country>
  <type>
    <translationType>New</translationType>
    <audience>Literary</audience>
  </type>
  <bookNames>
    <book code="GEN">
      <long>پیدایش</long>
      <short>پیدایش</short>
      <abbr />
    </book>
    <book code="EXO">
      <long>خروج</long>
      <short>خروج</short>
      <abbr />
    </book>
    <book code="LEV">
      <long>لاویان</long>
      <short>لاویان</short>
      <abbr />
    </book>
    <book code="NUM">
      <long>اعداد</long>
      <short>اعداد</short>
      <abbr />
    </book>
    <book code="DEU">
      <long>تثنیه</long>
      <short>تثنیه</short>
      <abbr />
    </book>
    <book code="JOS">
      <long>یوشع</long>
      <short>یوشع</short>
      <abbr />
    </book>
    <book code="JDG">
      <long>داوران</long>
      <short>داوران</short>
      <abbr />
    </book>
    <book code="RUT">
      <long>روت</long>
      <short>روت</short>
      <abbr />
    </book>
    <book code="1SA">
      <long>سموئیل (اوّل)</long>
      <short>۱سموئیل</short>
      <abbr />
    </book>
    <book code="2SA">
      <long>سموئیل (دوّم)</long>
      <short>۲سموئیل</short>
      <abbr />
    </book>
    <book code="1KI">
      <long>پادشاهان (اوّل)</long>
      <short>۱پادشاهان</short>
      <abbr />
    </book>
    <book code="2KI">
      <long>پادشاهان (دوّم)</long>
      <short>۲پادشاهان</short>
      <abbr />
    </book>
    <book code="1CH">
      <long>تواریخ (اوّل)</long>
      <short>۱تواریخ</short>
      <abbr />
    </book>
    <book code="2CH">
      <long>تواریخ (دوّم)</long>
      <short>۲تواریخ</short>
      <abbr />
    </book>
    <book code="EZR">
      <long>عِزرا</long>
      <short>عِزرا</short>
      <abbr />
    </book>
    <book code="NEH">
      <long>نِحِمیا</long>
      <short>نِحِمیا</short>
      <abbr />
    </book>
    <book code="EST">
      <long>اِستر</long>
      <short>اِستر</short>
      <abbr />
    </book>
    <book code="JOB">
      <long>ایوب</long>
      <short>ایوب</short>
      <abbr />
    </book>
    <book code="PSA">
      <long>مزامیر</long>
      <short>مزمور</short>
      <abbr />
    </book>
    <book code="PRO">
      <long>امثال سلیمان</long>
      <short>امثال</short>
      <abbr />
    </book>
    <book code="ECC">
      <long>جامعه</long>
      <short>جامعه</short>
      <abbr />
    </book>
    <book code="SNG">
      <long>غزل غزلهای سلیمان</long>
      <short>غزل غزل‌ها</short>
      <abbr />
    </book>
    <book code="ISA">
      <long>اِشعیا</long>
      <short>اِشعیا</short>
      <abbr />
    </book>
    <book code="JER">
      <long>اِرمیا</long>
      <short>اِرمیا</short>
      <abbr />
    </book>
    <book code="LAM">
      <long>مراثی اِرمیا</long>
      <short>مراثی اِرمیا</short>
      <abbr />
    </book>
    <book code="EZK">
      <long>حِزقیال</long>
      <short>حِزقیال</short>
      <abbr />
    </book>
    <book code="DAN">
      <long>دانیال</long>
      <short>دانیال</short>
      <abbr />
    </book>
    <book code="HOS">
      <long>هوشع</long>
      <short>هوشع</short>
      <abbr />
    </book>
    <book code="JOL">
      <long>یوئیل</long>
      <short>یوئیل</short>
      <abbr />
    </book>
    <book code="AMO">
      <long>عاموس</long>
      <short>عاموس</short>
      <abbr />
    </book>
    <book code="OBA">
      <long>عوبَدیا</long>
      <short>عوبَدیا</short>
      <abbr />
    </book>
    <book code="JON">
      <long>یونس</long>
      <short>یونس</short>
      <abbr />
    </book>
    <book code="MIC">
      <long>میکاه</long>
      <short>میکاه</short>
      <abbr />
    </book>
    <book code="NAM">
      <long>ناحوم</long>
      <short>ناحوم</short>
      <abbr />
    </book>
    <book code="HAB">
      <long>حَبَقوق</long>
      <short>حَبَقوق</short>
      <abbr />
    </book>
    <book code="ZEP">
      <long>صَفَنیا</long>
      <short>صَفَنیا</short>
      <abbr />
    </book>
    <book code="HAG">
      <long>حَجَّی</long>
      <short>حَجَّی</short>
      <abbr />
    </book>
    <book code="ZEC">
      <long>زکریا</long>
      <short>زکریا</short>
      <abbr />
    </book>
    <book code="MAL">
      <long>مَلاکی</long>
      <short>مَلاکی</short>
      <abbr />
    </book>
    <book code="MAT">
      <long>انجیل مَتّی</long>
      <short>مَتّی</short>
      <abbr />
    </book>
    <book code="MRK">
      <long>انجیل مَرقُس</long>
      <short>مَرقُس</short>
      <abbr />
    </book>
    <book code="LUK">
      <long>انجیل لوقا</long>
      <short>لوقا</short>
      <abbr />
    </book>
    <book code="JHN">
      <long>انجیل یوحنا</long>
      <short>یوحنا</short>
      <abbr />
    </book>
    <book code="ACT">
      <long>اعمال رسولان</long>
      <short>اعمال</short>
      <abbr />
    </book>
    <book code="ROM">
      <long>رومیان</long>
      <short>رومیان</short>
      <abbr />
    </book>
    <book code="1CO">
      <long>قرنتیان (اوّل)</long>
      <short>۱قرنتیان</short>
      <abbr />
    </book>
    <book code="2CO">
      <long>قرنتیان (دوّم)</long>
      <short>۲قرنتیان</short>
      <abbr />
    </book>
    <book code="GAL">
      <long>غلاطیان</long>
      <short>غلاطیان</short>
      <abbr />
    </book>
    <book code="EPH">
      <long>اَفِسسیان</long>
      <short>اَفِسسیان</short>
      <abbr />
    </book>
    <book code="PHP">
      <long>فیلیپیان</long>
      <short>فیلیپیان</short>
      <abbr />
    </book>
    <book code="COL">
      <long>کولُسیان</long>
      <short>کولُسیان</short>
      <abbr />
    </book>
    <book code="1TH">
      <long>تسالونیکیان (اوّل)</long>
      <short>۱تسالونیکیان</short>
      <abbr />
    </book>
    <book code="2TH">
      <long>تسالونیکیان (دوّم)</long>
      <short>۲تسالونیکیان</short>
      <abbr />
    </book>
    <book code="1TI">
      <long>تیموتائوس (اوّل)</long>
      <short>۱تیموتائوس</short>
      <abbr />
    </book>
    <book code="2TI">
      <long>تیموتائوس (دوّم)</long>
      <short>۲تیموتائوس</short>
      <abbr />
    </book>
    <book code="TIT">
      <long>تیتوس</long>
      <short>تیتوس</short>
      <abbr />
    </book>
    <book code="PHM">
      <long>فیلیمون</long>
      <short>فیلیمون</short>
      <abbr />
    </book>
    <book code="HEB">
      <long>عبرانیان</long>
      <short>عبرانیان</short>
      <abbr />
    </book>
    <book code="JAS">
      <long>نامۀ یعقوب</long>
      <short>یعقوب</short>
      <abbr />
    </book>
    <book code="1PE">
      <long>پطرس (اوّل)</long>
      <short>۱پطرس</short>
      <abbr />
    </book>
    <book code="2PE">
      <long>نامۀ دوّم پطرس</long>
      <short>۲پطرس</short>
      <abbr />
    </book>
    <book code="1JN">
      <long>یوحنا (اوّل)</long>
      <short>۱یوحنا</short>
      <abbr />
    </book>
    <book code="2JN">
      <long>یوحنا (دوّم)</long>
      <short>۲یوحنا</short>
      <abbr />
    </book>
    <book code="3JN">
      <long>یوحنا (سوّم)</long>
      <short>۳یوحنا</short>
      <abbr />
    </book>
    <book code="JUD">
      <long>نامۀ یهودا</long>
      <short>یهودا</short>
      <abbr />
    </book>
    <book code="REV">
      <long>مکاشفۀ یوحنا</long>
      <short>مکاشفه</short>
      <abbr />
    </book>
  </bookNames>
  <contents>
    <bookList default="true" id="1">
      <name>New Millenium Version</name>
      <nameLocal>هزارۀ نو</nameLocal>
      <abbreviation>NMV</abbreviation>
      <abbreviationLocal>NMV</abbreviationLocal>
      <description>The Persian New Millennium Version © 2014, is a production of Elam Ministries</description>
      <descriptionLocal>ترجمۀ هزارۀ نو، انتشارات ایلام، ۲۰۱۵، کلیۀ حقوق این اثر برای سازمان ایلام محفوظ است</descriptionLocal>
      <books>
        <book code="GEN" />
        <book code="EXO" />
        <book code="LEV" />
        <book code="NUM" />
        <book code="DEU" />
        <book code="JOS" />
        <book code="JDG" />
        <book code="RUT" />
        <book code="1SA" />
        <book code="2SA" />
        <book code="1KI" />
        <book code="2KI" />
        <book code="1CH" />
        <book code="2CH" />
        <book code="EZR" />
        <book code="NEH" />
        <book code="EST" />
        <book code="JOB" />
        <book code="PSA" />
        <book code="PRO" />
        <book code="ECC" />
        <book code="SNG" />
        <book code="ISA" />
        <book code="JER" />
        <book code="LAM" />
        <book code="EZK" />
        <book code="DAN" />
        <book code="HOS" />
        <book code="JOL" />
        <book code="AMO" />
        <book code="OBA" />
        <book code="JON" />
        <book code="MIC" />
        <book code="NAM" />
        <book code="HAB" />
        <book code="ZEP" />
        <book code="HAG" />
        <book code="ZEC" />
        <book code="MAL" />
        <book code="MAT" />
        <book code="MRK" />
        <book code="LUK" />
        <book code="JHN" />
        <book code="ACT" />
        <book code="ROM" />
        <book code="1CO" />
        <book code="2CO" />
        <book code="GAL" />
        <book code="EPH" />
        <book code="PHP" />
        <book code="COL" />
        <book code="1TH" />
        <book code="2TH" />
        <book code="1TI" />
        <book code="2TI" />
        <book code="TIT" />
        <book code="PHM" />
        <book code="HEB" />
        <book code="JAS" />
        <book code="1PE" />
        <book code="2PE" />
        <book code="1JN" />
        <book code="2JN" />
        <book code="3JN" />
        <book code="JUD" />
        <book code="REV" />
      </books>
    </bookList>
  </contents>
  <copyright>
    <statement contentType="xhtml">
      <p>The Persian New Millennium Version © 2014, is a production of Elam Ministries. All rights reserved.</p>
      <p>www.kalameh.com/shop</p>
      <p />
      <p />
    </statement>
  </copyright>
  <promotion>
    <promoVersionInfo contentType="xhtml">
      <p>The Persian New Millennium Version © 2014 a production of Elam Ministries. All rights reserved.</p>
      <p />
      <p>This publication contains New Millennium Version © 2014 by Elam Ministries. Unauthorized reproduction of this publication is prohibited.</p>
      <p />
      <p>The New Millennium Version, NMV, and the NMV logo are registered trademarks of Elam Ministries.</p>
      <p />
      <p>Notice of copyright must appear as follows on the title page or copyright page of printed works quoting from the NMV, or in a corresponding location when the NMV is quoted in other media:</p>
      <p />
      <p>“Scripture quotations are from The New Millennium Version, copyright © 2014 by Elam Ministries. Used by permission. All rights reserved.”</p>
      <p />
      <p>When more than one translation is quoted in printed works or other media, the foregoing notice of copyright should begin as follows:</p>
      <p />
      <p>“Unless otherwise indicated, all Scripture quotations are from . . . [etc.]”; or,</p>
      <p />
      <p>“Scripture quotations marked (NMV) are from . . . [etc.].”</p>
      <p />
      <p>The “NMV” and “The New Millennium Version” are registered trademarks of Elam Ministries. Use of either trademark requires the written permission of Elam Ministries.</p>
      <p />
      <p>When quotations from the NMV text are used in non-saleable media, such as church bulletins, orders of service, posters, transparencies, or similar media, a complete copyright notice is not required, but the initials (NMV) must appear at the end of the quotation.</p>
      <p />
      <p>Publication of any commentary or other Bible reference work produced for commercial sale that uses the New Millennium Version must include written permission for use of the NMV text.</p>
      <p />
      <p>Permission requests that exceed the above guidelines must be directed to Elam Ministries, Attn: Bible Rights, Elam Ministries P. O. Box 75, Godalming, Surrey, GU8 6YP, UK</p>
      <p />
      <p>Elam Ministries is a non-profit organization whose mission is to strengthen and expand the church in the Iran region and beyond.</p>
    </promoVersionInfo>
  </promotion>
  <archiveStatus>
    <archivistName>Nader Fard</archivistName>
    <dateArchived>2015-10-14T15:13:28.315502</dateArchived>
    <dateUpdated>2015-11-19T16:38:21.402881</dateUpdated>
    <comments>Updated Metadata2</comments>
  </archiveStatus>
  <format>text/xml</format>
</DBLMetadata>

*/
