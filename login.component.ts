import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { global } from '../global';
import { UrlService } from '../services/url.service';
import { Router } from '@angular/router';
import { ToastrService } from "ngx-toastr";
import { AuthService } from "../services/auth.service";
import {Ng2TelInputModule} from 'ng2-tel-input';
import { AngularFirestore, AngularFirestoreDocument  } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from "firebase/app";
declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm : FormGroup;
  loginresponse : any =[];
  mobileNo:any;
  countryCode;
  otpsent = false
  otp;
  responseOTP:any;
  otpJobId:any;
  otpUserId:any;
  headerTitle:string;
  password:any;
  confirmpassword:any;
  pswdblock = false

  timeLeft: number = 30;
  interval;
  hidetimer:boolean=false;
  dataRef:any;
  recaptchaVerifier:any = window;
  

  constructor(private http: HttpClient, private formBuilder: FormBuilder, private UrlService: UrlService, private router: Router, private toastrService: ToastrService, private authService: AuthService,
    public afAuth: AngularFireAuth, private firestore : AngularFirestore) { 
      
    }

  ngOnInit() {
    if(localStorage.getItem('karmaupLogin_state') == 'true'){
      this.router.navigate(['/feeds']);
    }
    this.headerTitle = "Forgot Password";
    this.loginForm = this.formBuilder.group({
      username: [''],
      password: ['']
    });
    var db = firebase.firestore();
    this.dataRef = db.collection("UserData");
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible',
      'callback': function(response) {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        
      }
    });
  }

  public doLogin(value){
    this.authService.userAuthentication(value,false);
  }

  startTimer() {
    this.interval = setInterval(() => {
      if(this.timeLeft > 0) {
        this.timeLeft--;
      } 
      if(this.timeLeft == 0){
        clearInterval(this.interval);
        this.hidetimer = true;
      }
    },1000)
  }

  public forgotPassword(state){  
    var self = this;
      var qRes = this.dataRef.where("mobileNumber", "==", this.mobileNo).get()
      .then(function(querySnapshot) {
        if(!querySnapshot.empty){
          self.afAuth.auth.signInWithPhoneNumber('+'+self.countryCode+self.mobileNo, self.recaptchaVerifier)
          .then((result) => { 
            self.responseOTP = result;      
            self.otpsent = true;
            self.headerTitle = "Phone Verification";
            self.toastrService.success("Otp sent successfully");
            if(state == 'fgpswd'){
              self.timeLeft = 30;
              self.hidetimer = false;
              self.startTimer();
            }
          }).catch((error) => {
            this.toastrService.success(error.message)
          })
        }else{
          self.toastrService.warning("Phone number does not exist");
          return false;
        }
      })
      .catch(function(error) {
      });  
      
    /*this.http.get(global.DOMAIN_URL+'/MobileAPIs/loginOTP?usernameOrMobile='+this.mobileNo + '&CountyCode=' +this.countryCode +'&ownerId='+global.OWNER_ID).subscribe((response:any) =>{
      if(response.status =="-1"){
        this.toastrService.warning(response.message);
      }else{
        this.otpJobId = response.jobId;
        this.otpUserId = response.userId;
        this.responseOTP = response.OTP
        this.otpsent = true;
        this.headerTitle = "Phone Verification";
        this.toastrService.success(response.message);
        if(state == 'fgpswd'){
          this.timeLeft = 30;
          this.hidetimer = false;
          this.startTimer();
        }
      }
     })*/
  }

  public otpVerification(){
    this.responseOTP.confirm(this.otp).then(user=>{
      this.pswdblock = true;
      this.headerTitle = "Change Password";
    }).catch((error) => {
      this.toastrService.success(error.message)
    });
    /*if(this.responseOTP  == this.otp){
      this.pswdblock = true;
      this.headerTitle = "Change Password";
    }else{
      this.toastrService.warning("Enter valid OTP");
    }*/
  }

  public updatepassword(){
    if(this.password !=undefined && this.password !=''){
      if(this.password.length < 8){
        this.toastrService.warning("Error: Password must contain at least 8 characters!");
        $("#password").focus();
        return false;
      }
      var re = /[A-Z]/;
      if(!re.test(this.password)) {
        this.toastrService.warning("Error: Password must contain at least one uppercase letter (A-Z)!");
        $("#password").focus();
        return false;
      }
      var specialcha = /[!@#\$%\^\&*\)\(+=._-]/;
      if(!specialcha.test(this.password)) {
        this.toastrService.warning("Error: Password must contain at least one special character");
        $("#password").focus();
        return false;
      }
    }else{
      this.toastrService.warning("Enter your password");
      $("#password").focus();
    }
    if(this.password == this.confirmpassword){
      this.password = encodeURIComponent(this.password)
        // this.password = this.password.includes("#");
        // this.password = this.password.replace("%23","#")
       //this.password = (this.password).includes('#')  ? (this.password).replace( '#', '%23' ) : (this.password);
      this.http.post(global.DOMAIN_URL+'/MobileAPIs/updateMultipleProperties?jobId='+this.otpJobId+'&ownerId='+this.otpUserId+'&jsonString={"password":"'+this.password+'"}','').subscribe((response:any) =>{
          if(response.status =="-1"){
          this.toastrService.warning(response.message);
        }else{
          this.toastrService.success("Password updated successfully");
          $('#forgotModal').modal('hide');
        }
      })
    }else{
      this.toastrService.warning("Password and confirmation password do not match.");
    }
  }

  viewpassword(){
    const obj = <HTMLScriptElement>document.getElementById("password");
    obj.type = "text";
  }
  hidepassword(){
    const obj = <HTMLScriptElement>document.getElementById("password");
    obj.type = "password";
  }

  viewCnfPassword(){
    const obj = <HTMLScriptElement>document.getElementById("cnfrmpswd");
    obj.type = "text";
  }
  hideCnfPassword(){
    const obj = <HTMLScriptElement>document.getElementById("cnfrmpswd");
    obj.type = "password";
  }

  telInputObject(obj) {
    obj.setCountry('in');
  }

  onCountryChange(obj)
  {
    this.countryCode=obj.dialCode;
  }
}
