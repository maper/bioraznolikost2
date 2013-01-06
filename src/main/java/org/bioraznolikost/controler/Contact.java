package org.bioraznolikost.controler;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.bioraznolikost.controler.util.Email;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class Contact  {
	public Contact() {
		// TODO Auto-generated constructor stub
	}
	@RequestMapping("contact/index")
	public ModelAndView contact(){
		
		return new ModelAndView("contact/form","command",new ContactData());
		
		//return "contact/form";
	}
    @RequestMapping("contact/send")
	public String send(@ModelAttribute("command")ContactData data, HttpServletRequest req,HttpServletResponse resp){
    	System.out.println("test"+data.getMsg());
    	Email email=new Email();
    	email.setFrom("mario@localhost.com");
    	email.setMsg(data.getMsg());
    	email.setSubject("test");
    	email.setTo("peranic@gmail.com");
    	try{
    	email.send();
    	}catch(Exception e){
    		System.out.println(e);
    	}
		return "contact/sent";
	}
    public static class ContactData{
    	
    	public ContactData() {
			// TODO Auto-generated constructor stub
		}
    	public String msg;
    	public void setMsg(String msg) {
			this.msg = msg;
		}
    	public String getMsg() {
			return msg;
		}
    }
}