class ApiError extends Error
{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],    
        stack = ""
    ){

        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.errors = errors
        this.success = false

        if(stack)
        {
            this.stack = stack;
        }

        else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}
/*
Understanding super() and this in JavaScript subclass constructors
What is going on when you extend a class and write a constructor in JavaScript?
1. this means “the current object being created”
When you create an object using a class, this refers to that specific new object inside the constructor or methods.

You use this to set or get properties of the object you are building.

2. When you extend a class (create a subclass), JavaScript needs to build the “base part” first
Your subclass is based on a parent class.

The parent class has its own constructor that builds important parts of the object (like the built-in Error constructor sets .message, .stack, etc.).

This base object must be created before your subclass can add its own custom properties.

3. super() calls the parent class constructor
Calling super() inside your subclass constructor tells JavaScript:
“Run the parent class’s constructor now, please.”

This creates and initializes the base object part.

Only after super() completes does this become usable.

4. You cannot use this before calling super()
If you try to use this (e.g., set properties) before calling super(), JavaScript throws an error.

That’s because the object does not exist yet — the base part hasn’t been created.

*/
