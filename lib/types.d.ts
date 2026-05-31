declare module "@aws-sdk/client-ses" {
  export class SESClient {
    constructor(config: { region: string });
    send(command: any): Promise<any>;
  }
  export class SendEmailCommand {
    constructor(input: any);
  }
}

declare module "@aws-sdk/client-cognito-identity-provider" {
  export class CognitoIdentityProviderClient {
    constructor(config: { region: string });
    send(command: any): Promise<any>;
  }
  export class AdminCreateUserCommand {
    constructor(input: any);
  }
  export class AdminSetUserPasswordCommand {
    constructor(input: any);
  }
}
