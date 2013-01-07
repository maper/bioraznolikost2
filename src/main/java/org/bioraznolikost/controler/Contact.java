package org.bioraznolikost.controler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.tanesha.recaptcha.ReCaptcha;
import net.tanesha.recaptcha.ReCaptchaFactory;
import net.tanesha.recaptcha.ReCaptchaResponse;

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
	public ModelAndView contact(HttpServletRequest request){
		ReCaptcha captcha=ReCaptchaFactory.newReCaptcha("6LcVNdsSAAAAAFCZ2gJ8DO-aj0aEqZyMiUS3T-ij", "6LcVNdsSAAAAAH_X_Sx_GVLpNLjBd5NELAiHnoLN", false);
		String captchaScript = captcha.createRecaptchaHtml(request.getParameter("error"), null);
		ContactData cd=new ContactData();
		cd.setReCaptcha(captchaScript);
		return new ModelAndView("contact/form","command",cd);
		
		//return "contact/form";
	}
    @RequestMapping("contact/send")
	public ModelAndView send(@ModelAttribute("command")ContactData data, HttpServletRequest req,HttpServletResponse resp){
    	System.out.println("test"+data.getMsg());
    	System.out.println("remote addr:"+req.getRemoteAddr()+";chlange fiels:"+req.getParameter("recaptcha_challenge_field")+";response field:"+ req.getParameter("recaptcha_response_field"));
    	ReCaptcha captcha = ReCaptchaFactory.newReCaptcha("6LcVNdsSAAAAAFCZ2gJ8DO-aj0aEqZyMiUS3T-ij", "6LcVNdsSAAAAAH_X_Sx_GVLpNLjBd5NELAiHnoLN", false);
        ReCaptchaResponse response = captcha.checkAnswer(req.getRemoteAddr(), req.getParameter("recaptcha_challenge_field"), req.getParameter("recaptcha_response_field"));
        ContactData cd=new ContactData();
        if (response.isValid()) {
        	Email email=new Email();
        	email.setFrom("mario@localhost.com");
        	email.setMsg(data.getMsg());
        	email.setSubject("test");
        	email.setTo("peranic@gmail.com");
        	try{
        	email.send();
        	}catch(Exception e){
        		System.out.println(e);
        		cd.setResponse(e.toString());
        		return new ModelAndView("contact/form","response",cd);
        	}
        	cd.setResponse("Bravo");
    		return new ModelAndView("contact/sent","response",cd);
        }
        else {
        	String captchaScript = captcha.createRecaptchaHtml(null, null);
        	cd.setResponse("pokusaj ponovno");
        	cd.setReCaptcha(captchaScript);
        	return new ModelAndView("contact/form","command",cd);    

        }
    	
	}
    public static class ContactData{
    	
    	public ContactData() {
			// TODO Auto-generated constructor stub
		}
    	private String msg;
    	private String reCaptcha;
    	private String response;
    	public String getResponse() {
			return response;
		}
		public void setResponse(String response) {
			this.response = response;
		}
		public void setMsg(String msg) {
			this.msg = msg;
		}
    	public String getMsg() {
			return msg;
		}
		public String getReCaptcha() {
			return reCaptcha;
		}
		public void setReCaptcha(String reCaptcha) {
			this.reCaptcha = reCaptcha;
		}
    	
    }
}