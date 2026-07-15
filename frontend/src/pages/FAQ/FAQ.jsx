import { useMemo, useState } from "react";
import "./faq.css";


const faqItems = [
  {
    id: 1,
    category: "reservation",
    question: "Comment fonctionne la réservation ?",
    answer:
      "Remplissez le formulaire de réservation. Votre demande est ensuite transmise à STAY, puis vous êtes redirigé vers WhatsApp afin de finaliser votre séjour avec notre équipe.",
  },
  {
    id: 2,
    category: "payment",
    question: "Les tarifs affichés sont-ils définitifs ?",
    answer:
      "Les tarifs sont donnés à titre indicatif. Le montant final peut varier selon la période, le type de chambre choisi et les disponibilités de l’établissement.",
  },
  {
    id: 3,
    category: "reservation",
    question: "Comment ma réservation est-elle confirmée ?",
    answer:
      "Après réception de votre demande, notre équipe vérifie les disponibilités auprès de l’établissement, puis vous confirme la réservation et le tarif final par WhatsApp.",
  },
  {
    id: 4,
    category: "reservation",
    question: "Puis-je modifier ou annuler ma demande ?",
    answer:
      "Oui. Contactez STAY dès que possible par WhatsApp ou par téléphone afin que notre équipe puisse mettre votre demande à jour.",
  },
  {
    id: 5,
    category: "payment",
    question: "Le paiement se fait-il directement sur STAY ?",
    answer:
      "Non. STAY facilite la mise en relation et la demande de réservation. Les modalités de paiement vous sont communiquées lors de la confirmation avec l’établissement.",
  },
  {
    id: 6,
    category: "support",
    question: "Comment contacter STAY ?",
    answer:
      "Notre équipe est disponible par WhatsApp ou par téléphone pour répondre à vos questions et vous accompagner dans votre demande de réservation.",
  },
];


const categories = [
  {
    id: "all",
    label: "Toutes",
    description: "Voir toutes les questions",
  },
  {
    id: "reservation",
    label: "Réservation",
    description: "Demandes, confirmation et modifications",
  },
  {
    id: "payment",
    label: "Tarifs & paiement",
    description: "Prix, estimation et règlement",
  },
  {
    id: "support",
    label: "Assistance",
    description: "Contacter et être accompagné",
  },
];


function FAQ() {
  const [openItemId, setOpenItemId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");


  const toggleItem = (itemId) => {
    setOpenItemId((currentId) =>
      currentId === itemId ? null : itemId,
    );
  };


  const filteredFaqItems = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();


    return faqItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" ||
        item.category === activeCategory;


      const matchesSearch =
        normalizedSearch === "" ||
        item.question
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.answer
          .toLowerCase()
          .includes(normalizedSearch);


      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);


  return (
    <section className="faq-page">
      <div className="faq-shell">
        <header className="faq-hero">
          <span className="faq-eyebrow">
            Centre d’aide
          </span>


          <h1>Questions fréquentes</h1>


          <p>
            Retrouvez rapidement les réponses essentielles
            avant de réserver votre séjour avec STAY.
          </p>
        </header>


        <div className="faq-search-wrap">
          <label
            htmlFor="faqSearch"
            className="faq-search-label"
          >
            Rechercher une question
          </label>


          <div className="faq-search-field">
            <input
              id="faqSearch"
              type="search"
              placeholder="Que souhaitez-vous savoir ?"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />


            <span
              className="faq-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>
          </div>
        </div>


        <section className="faq-categories-section">
          <div className="faq-section-heading">
            <span>Catégories</span>


            <p>
              Sélectionnez un thème pour afficher les
              questions correspondantes.
            </p>
          </div>


          <div className="faq-categories">
            {categories.map((category) => {
              const isActive =
                activeCategory === category.id;


              return (
                <button
                  key={category.id}
                  type="button"
                  className={`faq-category-card ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setOpenItemId(null);
                  }}
                  aria-pressed={isActive}
                >
                  <span className="faq-category-index">
                    {String(
                      categories.findIndex(
                        (item) =>
                          item.id === category.id,
                      ) + 1,
                    ).padStart(2, "0")}
                  </span>


                  <div>
                    <h2>{category.label}</h2>


                    <p>{category.description}</p>
                  </div>


                  <span
                    className="faq-category-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </section>


        <section className="faq-questions-section">
          <div className="faq-section-heading faq-questions-heading">
            <span>Questions</span>


            <p>
              {filteredFaqItems.length} résultat
              {filteredFaqItems.length > 1 ? "s" : ""}
            </p>
          </div>


          <div className="faq-list">
            {filteredFaqItems.length > 0 ? (
              filteredFaqItems.map((item) => {
                const isOpen =
                  openItemId === item.id;


                const answerId =
                  `faq-answer-${item.id}`;


                return (
                  <article
                    key={item.id}
                    className={`faq-item ${
                      isOpen ? "is-open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="faq-question"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() =>
                        toggleItem(item.id)
                      }
                    >
                      <span className="faq-question-text">
                        {item.question}
                      </span>


                      <span
                        className="faq-icon"
                        aria-hidden="true"
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>


                    <div
                      id={answerId}
                      className="faq-answer-wrapper"
                      aria-hidden={!isOpen}
                    >
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="faq-empty-state">
                <span>Aucun résultat</span>


                <p>
                  Essayez un autre mot-clé ou revenez à
                  toutes les catégories.
                </p>


                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("all");
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}


export default FAQ;
