import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WebAuthnAssertionDto {
  @IsString()
  @IsNotEmpty()
  challenge: string;

  @IsObject()
  @IsNotEmpty()
  assertion: {
    id: string;
    rawId: string;
    response: {
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
      userHandle?: string;
    };
    type: string;
  };
}
