<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@page contentType="text/html;charset=UTF-8"%>
<html>
<head>
<title>Bioraznolikost</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<META HTTP-EQUIV="CACHE-CONTROL" CONTENT="NO-CACHE">
<META HTTP-EQUIV="CONTENT-LANGUAGE" CONTENT="hr">
<META NAME="KEYWORDS" CONTENT="">
<META NAME="ROBOTS" CONTENT="ALL"> 
<link href="../_css/stylesheet.css" rel="stylesheet" type="text/css"/>

<script type="text/javascript" src="../_jscript/jquery/jquery-1.8.3.min.js"></script>
<script type="text/javascript" src="../_jscript/jquery/jquery-ui-1.9.2.custom/js/jquery-ui-1.9.2.custom.min.js"></script>
<link rel="stylesheet" href="../_jscript/jquery/jquery-ui-1.9.2.custom/css/ui-lightness/jquery-ui-1.9.2.custom.min.css" type="text/css" media="all" />

<script>
function loadContent() 
{ 
	 $("#left_sidebar_container").load("../index.jsp #left_sidebar");
     $("#header_container").load("../index.jsp #header");
} 
</script>

</head>

<body bgcolor="#FFFFFF" text="#000000" leftmargin="0" topmargin="0" onload="loadContent()">

<div  id="header_container">
 
</div>
<div id="main" >
	<div id="left_sidebar_container">
	</div>

	<div id="content_main" style="">

	
	  <form:form action="send.do" method="POST">
	  <table>
	  <tr><td style="">Poruka:</td><td rowspan="2"><form:textarea path="msg" /></td></tr>
	  <tr><td colspan="2"><input type="submit" value="pošalji"/></td></tr>
	  </table>
	  </form:form>
	</div>

	<div id="right_sidebar">
	 
	</div>
</div>
</body>
</html>
