import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WebAuthnAttestationDto {
  @IsString()
  @IsNotEmpty()
  challenge: string;

  @IsObject()
  @IsNotEmpty()
  credential: {
    id: string;
    rawId: string;
    response: {
      attestationObject: string;
      clientDataJSON: string;
    };
    type: string;
  };
}
