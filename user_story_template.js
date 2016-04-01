/* A script to be used with the Taiga software. It will authenticate
*  and then perform different operations using the Taiga API.
*
* @author: Jared McReynolds
*
* */




// Stub of the URL used in all url's
var url = "http://taiga.peachtreebilling.local/api/v1";

/*Gets the initial authentication token needed to communicate with the API
*
* */
function get_token(){
    //alert("Starting processing...");
    var auth_token = localStorage.getItem("token");
    //chrome.storage.local.get('token', function(result){
    //auth_token = result.token;
    //});      
       
    
    //Username and Password for Authentication(maybe make it dynamic)
    var USERNAME = username;
    var PASSWORD = password;

    //Url with added specific path 
    var full_url = url + "/auth";
    
    //Array of data to use in Post request
    var data_array = {"type":"ldap",
                      "username": USERNAME,
                      "password": PASSWORD };

    //Convert array into JSON object for request
    var request_data = JSON.stringify(data_array);
    var auth_request_object = make_http_request("POST", full_url, request_data, false, false);
    var http_response_text = JSON.parse(auth_request_object.responseText);
    return http_response_text.auth_token;
     
}

/* Make a HTTP request
*
*@param {string} url The url of Taiga
*@param {string} method The method request method used i.e. POST or GET
*@param {JSON} data The data needed if request is a POST
*@param {boolean} bearerHeader Sets whether the request needs a header with Authentication token
*@param {Boolean} async Sets whether the request is asynchronous
*@param (string} auth_token Authentication token that is needed for the Bearer header
**/
function make_http_request(method, url, data, bearerHeader, async, auth_token){
    var req = new XMLHttpRequest();

    req.open(method, url, false);
    req.setRequestHeader('Content-Type', 'application/json');
    if(bearerHeader){
        req.setRequestHeader('Authorization', 'Bearer ' + auth_token);
    }
    req.send(data);
    //var response = JSON.parse(req.responseText);
    return req;
}

/* Get the project id using the url slug in order to get the issue that we need.
*
* @param {Object} Response body from an Http response
* @return {string} Project id number
* */
function get_project_id(http_req){
    var http_response_text = JSON.parse(http_req.responseText);    
    var project_id = http_response_text.id;
    
    return project_id;
}

/* Function that uses the issue by ref number and project id to collect information
* from the issue
*
* @param {Object} Response body from an Http response
* @return {string} Issue description
* */
function get_issue_description(http_req){
      
    var http_response_text = JSON.parse(http_req.responseText);    
    var issue_desc = http_response_text.description;
    return issue_desc;
}


/* Function that take in information about an issue and uses it
m the issue
*
* @param {Object} Response body from an Http response
* @return {string} Issue subject
* */
function get_issue_subject(http_req){
    
    var http_response_text = JSON.parse(http_req.responseText);    
    var issue_subject = http_response_text.subject;
    return issue_subject;
}

 /* to make a new user story.
 *
 * @param {number} project_id The id for the project the user story will be placed
 * @param {string} subject The subject of the issue that will be transferred to the user story
 * @param {string} issue_description The description of the issue that will be transferred to the user story
 *
 * */
function promote_issue(project_id, subject, issue_description, auth_token){
    //Url needed to create a new user story
    var full_url = url + "/userstories";

    var request_data = JSON.stringify({"project": project_id,
                        "subject": subject});

    var response = make_http_request("POST", full_url, request_data, true, false, auth_token);
    var http_response_text = JSON.parse(response.responseText);
    
    user_story_id = http_response_text.id;
    return user_story_id; 
    
}

/*Function that adds a tasks to the user story just created.
 *
 *@param {number} project_id The id for the project the user story will be placed
 *@param {number} us_id The id of the user story where the task will be added
 *@param {number} subject The string from the description that will become the tasks subject
 *@param {number} index Index of the array of tasks
 * */
function create_subtasks(project_id, us_id, subject, index, auth_token){
    //Url needed to create a task
    var full_url = url + "/tasks";

    //Required information to add tasks
    var request_data = JSON.stringify({"user_story": us_id ,
	                               "subject": subject,
	                               "project": project_id,
		                       "description": index});

    console.log("Adding Task...");
    var response = make_http_request("POST", full_url, request_data, true, false, auth_token);
    var http_response_text = JSON.parse(response.responseText);
    
    console.log(http_response_text);
    return http_response_text.status;    
} 

/* Gather information from the issue description for creating sub-tasks
*
*@param {string} description The description taken from the issue to be parse into sub-tasks for the new user story
*@param {number} project_id Project id of the user story to which tasks will be added
*@param {number} user_story_id Id of of the user story to which tasks will be added 
* */
function add_tasks(description, project_id, user_story_id, auth_token){
    console.log(description)
    var description_array = description.split(",");
    var all_tasks_array = [];
    console.log(all_tasks_array);
    for(var i= 0; i < description_array.length; i++){
       var individual_task_array = [];
       individual_task_array = description_array[i].split(">");
       all_tasks_array.push(individual_task_array);
    }

    for(var j = 0; j < all_tasks_array.length; j++){
       (create_subtasks(project_id, user_story_id, all_tasks_array[j][0], all_tasks_array[j][1], auth_token));
    }
}

//var url_string;
/* Function to get the project slug from the current tab url  
*
**/
function get_proj_slug(url_string){
 
    var path_array = url_string.split('/');
        
    var proj_slug;
    for(var i = 0; i < path_array.length; i++){
       if(path_array[i] == "project"){
       proj_slug = path_array[i+ 1];
       }
    }
    console.log(proj_slug);
    return proj_slug;
}
       


/* Function to get the URL of the current tab, MUST BE ON AN ISSUE PAGE
*
*
**/
function get_issue_URL(){
    console.log("Getting URL...");
    var url_string;
    return new Promise(function(resolve, reject){
        chrome.tabs.query({currentWindow:true, active: true}, function(tabs){
            url_string = tabs[0].url;
            console.log(url_string);
                        
       
           if(typeof(url_string) != "undifined"){
               resolve(url_string);
           }
           else{
           reject(Error("Didn't get URL!"));
           }
   
        });
    });
}

/*Function to get the issue number from the URL
*
**/
function get_issue_number(url_string){
var path_array = url_string.split('/');

    var issue_num;
    for(var i = 0; i < path_array.length; i++){
       if(i == path_array.length-1){
           issue_num  = path_array[i];
       }
    }

    console.log(issue_num);
    return issue_num;
}

function loading(){


  document.getElementById('create_story').style.display = 'none';
  console.log("button gone");
  document.getElementById('spinner').style.display = 'block';
  console.log("spinner");
 
}

/* Gets the current tabs cookie information
*
**/
function get_cookie_info(){
   chrome.tabs.query({"status": "complete", "windowId":chrome.windows.WINDOW_ID_CURRENT, "active": true}, function(tabs){
         var token = tabs[0].localStorage.getItem("token");        
  
         //console.log(JSON.stringify(tabs));
      //chrome.storage.localStorage.get('token', function(result){
        // console.log(result.token);

           
   });   
}

/* Function that handles the execution of the program
*
**/
function main(){

//var token = get_cookie_info();
var auth_token = get_token();
 console.log(auth_token);
  var info = get_issue_URL()
     .then(function(url_string){
       return Promise.all([
       url_string,
       loading(),
       issue_num = get_issue_number(url_string),
       console.log(auth_token),       
       project_slug = get_proj_slug(url_string),
       console.log(project_slug),
       get_id_response = make_http_request("GET", url + "/projects/by_slug?slug=" + project_slug, null, true, false, auth_token),
       console.log(get_id_response), 
       project_id = get_project_id(get_id_response),
       console.log(project_id),
       get_description_response = make_http_request("GET", url + "/issues/by_ref?ref=" + issue_num + "&project=" + project_id, null, true, false, auth_token),
       issue_description = get_issue_description(get_description_response),
       console.log(issue_description),
       issue_subject_response = make_http_request("GET", url + "/issues/by_ref?ref=" + issue_num + "&project=" + project_id, null, true, false, auth_token),
       issue_subject = get_issue_subject(issue_subject_response),
       console.log(issue_subject),
       new_us_id = promote_issue(project_id, issue_subject, issue_description, auth_token),
       console.log(new_us_id),
       new_task = add_tasks(issue_description, project_id, new_us_id, auth_token),
       console.log(new_task),
       alert("User Story Complete"),
       //window.close()
      
    ]);
   });
}

document.getElementById('create_story').addEventListener('click', main);
