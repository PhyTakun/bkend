class ApiResponse{
    constructor(statusCode, data, message = "Success")
    {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}


// the purpose behind above code is strucuture and similar response to different type of requests. 
// however, currently in this code, only properties are assigned, not return-ed, so how it will work
// idk
// currently, it's just a class with properties setted through arguments and extra sneaky loc