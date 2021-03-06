import {Component, OnInit} from '@angular/core';
import {PaymentMethodsService} from "../../services/payment-methods.service";
import {PaymentMethod} from "../../models/PaymentMethod";
import {Observable} from "rxjs";
import {TransactionsService} from "../../services/transactions.service";
import {TransactionBuilder} from "../../classes/TransactionBuilder";
import {IUserData} from "../../classes/interfaces/IUserData";
import {ITransactionData} from "../../classes/interfaces/ITransactionData";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material";
import {HttpErrorResponse} from "@angular/common/http";
import {LoaderController} from "../../helpers/loader-controller";


export enum PAYMENT_METHOD {
    WITHDRAW = 'withdraw',
    DEPOSIT = 'deposit'
}

enum PAYMENT_STEPS {
    PAYMENT_METHOD_SELECT,
    USER_DATA,
    TRANSACTION_DETAILS,
    TRANSACTION_ADDITIONAL_DATA,
    FINISH
}

@Component({
    selector: 'app-payment-modal',
    templateUrl: './payment-modal.component.html',
    styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent implements OnInit {
    private paymentMethod: PAYMENT_METHOD;
    private PAYMENT_METHOD = PAYMENT_METHOD;
    PAYMENT_STEPS = PAYMENT_STEPS;
    step: PAYMENT_STEPS = PAYMENT_STEPS.PAYMENT_METHOD_SELECT;

    paymentServices: Observable<PaymentMethod[]>;
    paymentProvider: PaymentMethod;
    private transactionBuilder: TransactionBuilder;
    userObject: IUserData | any = {};
    transactionObject: ITransactionData | any = {};
    transactionAdditionalData = {};
    errors: any = { user: {} };

    constructor(private paymentMethodsService: PaymentMethodsService,
                private transactionsService: TransactionsService,
                private router: Router,
                private matDialog: MatDialog,
                private loadCtrl: LoaderController) {
    }

    async ngOnInit() {
        this.paymentMethodsService.getPaymentMethods();
        this.paymentServices = this.paymentMethodsService.paymentMethods;
        this.transactionBuilder = new TransactionBuilder();
    }

    onChoosePaymentMethod(paymentProvider: PaymentMethod, paymentMethod: PAYMENT_METHOD) {
        this.paymentMethod = paymentMethod;
        this.paymentProvider = paymentProvider;
        this.transactionBuilder.setMethod(paymentMethod);
        this.transactionBuilder.setProvider(paymentProvider.name);
        this.step = PAYMENT_STEPS.USER_DATA;
    }

    onGoToStep(step: PAYMENT_STEPS) {
        switch (this.step) {
            case PAYMENT_STEPS.USER_DATA:
                this.transactionBuilder.setUser(this.userObject);
                break;
            case PAYMENT_STEPS.TRANSACTION_DETAILS:
                this.transactionBuilder.setTransactionData(this.transactionObject.amount, this.transactionObject.currency);
                break;
            case PAYMENT_STEPS.TRANSACTION_ADDITIONAL_DATA:
                this.transactionBuilder.setAdditionalData(this.transactionAdditionalData);
                return this.onFinish();
        }

        this.step = step;
    }

    onFinish() {
        this.loadCtrl.presetLoader();
        this.transactionsService.createTransaction(this.transactionBuilder.transaction).subscribe((result) => {
            this.router.navigate(['/summarize', { status: result.status }]);
            this.matDialog.closeAll();
            this.loadCtrl.hideLoader();
        }, (error: HttpErrorResponse)  => {
            this.loadCtrl.hideLoader();
            if(error.status === 422) {
                this.errors = error.error.validation_messages;
                if(this.errors.user && typeof this.errors.user === 'object') {
                    this.step = PAYMENT_STEPS.USER_DATA;
                } else if(this.errors.amount || this.errors.currency) {
                    this.step = PAYMENT_STEPS.TRANSACTION_DETAILS;
                }
            }
            console.log(error);
        });
    }
}
