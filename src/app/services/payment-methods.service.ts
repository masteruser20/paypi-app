import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {PaymentMethod} from "../models/PaymentMethod";
import {environment} from "../../environments/environment";
import {map, share} from "rxjs/operators";
import {BehaviorSubject, Observable, Subscription} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class PaymentMethodsService {
    paymentMethods: Observable<PaymentMethod[]>;
    private _paymentMethods: BehaviorSubject<PaymentMethod[]>;

    constructor(private httpClient: HttpClient) {
        this._paymentMethods = <BehaviorSubject<PaymentMethod[]>>new BehaviorSubject([]);
        this.paymentMethods = this._paymentMethods.asObservable();
    }

    getPaymentMethods(): Observable<any> {
        if(this._paymentMethods.value.length) {
            return null;
        }

        const request = this.httpClient.get(environment.apiUrl + '/methods').pipe(share());

        request.pipe(map((result: any) => {
            console.log(result);
            return result.map((paymentMethod) => {
                return new PaymentMethod(
                    paymentMethod.id,
                    paymentMethod.name,
                    paymentMethod.label,
                    paymentMethod.types,
                    paymentMethod.additionalData
                );
            });
        })).subscribe(paymentMethods => {
            this._paymentMethods.next(paymentMethods);
        }, error => {
            console.log(error);
        });

        return request;
    }
}
